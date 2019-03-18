const fs = require('fs');
const path = require('path');
const assert = require('assert');
const OSS = require('ali-oss');
const Promise = require('bluebird');
const chalk = require('chalk');
const ProgressBar = require('progress');

const green = chalk.green;
const red = chalk.red;
const yellow = chalk.yellow;

const defaultCfg = {
  accessKeyId: '',
  accessKeySecret: '',
  region: '',
  bucket: '',
  prefix: '',
  uploadType: 'multipart',
  uploadOptions: {
    parallel: 4, // [multipart]
    partSize: 1024 * 200, // 200M [multipart]
    timeout: 6000, // 6s [put, stream, multipart]
    retries: 5, // [multipart]
    useChunk: false // [stream]
  },
  concurrency: 3,
  excludes: [],
  debug: false
};

class AliOSSUploadPlugin {
  constructor(opts) {
    this.config = this.mergeConfig(opts);
    const { accessKeyId, accessKeySecret, region, bucket } = this.config;
    this.client = new OSS({
      accessKeyId,
      accessKeySecret,
      region,
      bucket
    });
    this.stats = {
      currentIndex: 0,
      len: 0
    };
  }

  apply(compiler) {
    this.log(yellow('[WebpackAliOSSUploadPlugin] config:'), yellow(JSON.stringify(this.config, null, 2)));
    const { uploadType } = this.config;
    if (uploadType === 'put') {
      compiler.hooks.emit.tapAsync('AliOSSUploadPlugin', async (compilation, callback) => {
        const assets = this.commonHandle(compilation);
        await this.putUploadFiles(assets);
        this.endLog();
        callback();
      });
    } else if (uploadType === 'stream') {
      compiler.hooks.afterEmit.tapAsync('AliOSSUploadPlugin', async (compilation, callback) => {
        const assets = this.commonHandle(compilation);
        await this.streamUploadFiles(compiler, assets);
        this.endLog();
        callback();
      });
    } else {
      compiler.hooks.afterEmit.tapAsync('AliOSSUploadPlugin', async (compilation, callback) => {
        const assets = this.commonHandle(compilation);
        await this.multipartUploadFiles(compiler, assets);
        this.endLog();
        callback();
      });
    }
  }

  mergeConfig(opts) {
    const config = {
      ...defaultCfg,
      ...opts
    };
    const customUploadOpts = opts.uploadOptions || {};
    config.uploadOptions = { ...defaultCfg.uploadOptions, ...customUploadOpts };
    config.excludes = Array.isArray(opts.excludes) ? [...defaultCfg.excludes, ...opts.excludes] : [opts.excludes];
    return config;
  }

  filterAssets(assets) {
    const excludes = this.config.excludes;
    const fileNames = Object.keys(assets);
    const arr = fileNames.filter((fileName) => {
      for (let i = 0; i < excludes.length; i++) {
        const reg = excludes[i];
        assert.equal(Object.prototype.toString.call(reg), '[object RegExp]');
        if (reg.test(fileName)) {
          return false;
        }
      }
      return true;
    }).map((fileName) => ({
      name: fileName,
      content: assets[fileName].source()
    }));
    // Array [{ name, content }]
    return arr;
  }

  getOssFileName(fileName) {
    const { prefix } = this.config;
    return path.join(prefix, fileName);
  }

  commonHandle(compilation) {
    const { debug } = this.config;
    const assets = this.filterAssets(compilation.assets);
    this.stats.len = assets.length;
    this.log(green(`文件开始上传, total: ${this.stats.len}`));
    if (!debug) {
      this.bar = new ProgressBar(':prefix [:bar] :current/:total', {
        stream: process.stdout,
        width: 50,
        incomplete: ' ',
        total: this.stats.len
      });
    }
    return assets;
  }

  showProgress(name) {
    const { debug } = this.config;
    this.log(green(`上传成功：${name} `), yellow(this.getPercentage()));
    if (!debug) {
      this.bar.tick({
        curr: this.stats.currentIndex,
        prefix: '[WebpackAliOSSUploadPlugin]'
      });
    }
  }

  putUploadFiles(files) {
    const { concurrency } = this.config;
    return Promise.map(
      files,
      async (file) => await this.put(file.name, file.content),
      { concurrency }
    );
  }

  streamUploadFiles(compiler, files) {
    const { concurrency } = this.config;
    const outputPath = compiler.options.output.path;
    return Promise.map(
      files,
      async (file) => await this.putStream(file.name, path.resolve(outputPath, file.name)),
      { concurrency }
    );
  }

  multipartUploadFiles(compiler, files) {
    const { concurrency } = this.config;
    const outputPath = compiler.options.output.path;
    return Promise.map(
      files,
      async (file) => await this.multipartUpload(file.name, path.resolve(outputPath, file.name)),
      { concurrency }
    );
  }

  async put(fileName, content) {
    const { timeout } = this.config.uploadOptions;
    const ossFileName = this.getOssFileName(fileName);
    try {
      const result = await this.client.put(ossFileName, Buffer.from(content), { timeout });
      this.stats.currentIndex++;
      this.showProgress(result.name);
    } catch (e) {
      this.log(red(JSON.stringify(e)));
    }
  }

  async putStream(fileName, localPath) {
    const { timeout, useChunk } = this.config.uploadOptions;
    const ossFileName = this.getOssFileName(fileName);
    try {
      let result = {};
      if (useChunk) {
        const stream = fs.createReadStream(localPath);
        const size = fs.statSync(localPath).size;
        result = await this.client.putStream(ossFileName, stream, {
          contentLength: size,
          timeout
        });
      } else {
        const stream = fs.createReadStream(localPath);
        result = await this.client.putStream(ossFileName, stream, { timeout });
      }
      this.stats.currentIndex++;
      this.showProgress(result.name);
    } catch (e) {
      this.log(red(JSON.stringify(e)));
    }
  }

  async multipartUpload(fileName, localPath) {
    const { parallel, partSize, timeout, retries } = this.config.uploadOptions;
    const ossFileName = this.getOssFileName(fileName);
    let checkpoint;
    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.client.multipartUpload(ossFileName, localPath, {
          parallel,
          partSize,
          timeout,
          checkpoint,
          async progress(percentage, cpt) {
            checkpoint = cpt;
          }
        });
        this.stats.currentIndex++;
        this.showProgress(result.name);
        break;
      } catch (e) {
        this.log(red(JSON.stringify(e)));
        // 捕获超时异常
        if (e.code === 'ConnectionTimeoutError') {
          this.log(red('ConnectionTimeoutError: 可尝试'), yellow('缩小分片大小'), red('|'), yellow('加大超时时间'), red('|'), yellow('加大重试次数'));
        }
      }
    }
  }

  getPercentage() {
    const { currentIndex, len } = this.stats;
    return `${Math.round(currentIndex / len * 1000) / 10}%`;
  }

  log(...args) {
    if (this.config.debug) {
      console.log(...args);
    }
  }

  endLog() {
    const { currentIndex, len } = this.stats;
    let desc = currentIndex < len ? 'finished, 1 failed' : 'success';
    console.log(yellow(`[WebpackAliOSSUploadPlugin] ${desc}`));
  }
}

module.exports = AliOSSUploadPlugin;
