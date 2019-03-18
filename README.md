# webpack-alioss-upload-plugin

A flexible webpack plugin to upload files to aliyun oss, which supports multiple optional upload methods and parameters.

## Installation

```bash
npm i webpack-alioss-upload-plugin -D
```

or

```bash
yarn add webpack-alioss-upload-plugin -D
```

## Usage

Here is a simplest usage.

```javascript
const AliOSSUploadPlugin = require('webpack-alioss-upload-plugin');
// webpack config
module.exports = {
  plugins: [
    new AliOSSUploadPlugin({
      accessKeyId: 'your.oss.accessKeyId',
      accessKeySecret: 'your.oss.accessKeySecret',
      region: 'your.oss.region',
      bucket: 'your.oss.bucket'
    })
  ]
}
```

## Options

- `accessKeyId`: [String] the accessKeyId of your oss, `required`;
- `accessKeySecret`: [String] the accessKeySecret of your oss, `required`;
- `region`: [String] the region of your oss, `required`;
- `bucket`: [String] the bucket name of your oss, `required`;
- `prefix`: [String] the path to direct to files on oss, if configured, looks like "https://${bucket}.${region}.aliyuncs.com/${prefix}/local-resolved-file-name", default `''`;
- `uploadType`: [String], has three types(`put`|`stream`|`multipart`), corresponding to alioss's upload methods(`put`|`putStream`|`multipart`), default `multipart`, more info see [here](https://github.com/ali-sdk/ali-oss);
- `uploadOptions`: [Object]
  - `parallel`: [Number] the number of parts to be uploaded in parallel, default `4`;
  - `partSize`: [Number] the suggested size for each part in `KB`, default `204800`(200M), alioss's minimum partsize must larger than 100M;
  - `timeout`: [Number] the operation timeout in milliseconds, default `6000`;
  - `retries`: [Number] retry times if multipart upload is interrupted, only work when uploadType is `multipart`
  - `useChunk`: [Boolean] whether or not use `chunked encoding`, only work when uploadType is `stream`, default `false`, more info see [here](https://github.com/ali-sdk/ali-oss#putstreamname-stream-options);
- `concurrency`: [Number] allow how many upload event to be created at the meanwhile, default `3`, may your system may crash if this parameter is too large;
- `excludes`: [RegExp|Array[RegExp]] files not wanting to upload to oss, default `[]`;
- `debug`: [Boolean] whether or not show verbose log on command line, default `false`;

## License

[MIT](./LICENSE)

## Author

Javen Leung
