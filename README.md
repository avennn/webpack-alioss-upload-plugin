# webpack-alioss-upload-plugin

A webpack plugin to upload files to aliyun oss, which supports multiple optional upload method

## Install

```bash
npm i webpack-alioss-upload-plugin -D
```

or

```bash
yarn add webpack-alioss-upload-plugin -D
```

## Usage

Simplest usage.

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
