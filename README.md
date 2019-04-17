# webpack-alioss-upload-plugin

A flexible webpack plugin to upload files to aliyun oss, which supports multiple optional upload methods and parameters.

> This plugin only works with webpack version above 4.0

## Advantages

- Supports 3 alternative upload methods that aliyun oss supports.

- Supports multipart upload and retries at the breakpoints.

- Can custom timeout to drop the request.

- Can control how many http request threads are created at the meanwhile. Too many threads may result in an error returned from aliyun.

- Can switch debug mode to decide whether or not showing verbose log.

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
};
```

## Options

- `accessKeyId`:&emsp;[String]&emsp;the accessKeyId of your oss, `required`.
- `accessKeySecret`:&emsp;[String]&emsp;the accessKeySecret of your oss, `required`.
- `region`:&emsp;[String]&emsp;the region of your oss, `required`.
- `bucket`:&emsp;[String]&emsp;the bucket name of your oss, `required`.
- `prefix`:&emsp;[String]&emsp;the path to direct to files on oss, if configured, it looks like "https://${bucket}.${region}.aliyuncs.com/${prefix}/local-resolved-file-name", default `''`.
- `uploadType`:&emsp;[String]&emsp;has three types(`put`|`stream`|`multipart`), corresponding to alioss's upload methods(`put`|`putStream`|`multipart`), default `multipart`, more info see [here](https://github.com/ali-sdk/ali-oss).
- `uploadOptions`:&emsp;[Object]
  - `parallel`:&emsp;[Number]&emsp;the number of parts to be uploaded in parallel, default `4`.
  - `partSize`:&emsp;[Number]&emsp;the suggested size for each part in `KB`, default `204800`(200M), alioss's minimum partsize must larger than 100M.
  - `timeout`:&emsp;[Number]&emsp;the operation timeout in milliseconds, default `6000`.
  - `retries`:&emsp;[Number]&emsp;retry times if multipart upload is interrupted, only work when uploadType is `multipart`
  - `useChunk`:&emsp;[Boolean]&emsp;whether or not use `chunked encoding`, only work when uploadType is `stream`, default `false`, more info see [here](https://github.com/ali-sdk/ali-oss#putstreamname-stream-options).
- `concurrency`:&emsp;[Number]&emsp;allow how many upload event to be created at the meanwhile, default `3`, may your system may crash if this parameter is too large.
- `excludes`:&emsp;[RegExp|Array[RegExp]]&emsp;files not wanting to upload to oss, default `[]`.
- `debug`:&emsp;[Boolean]&emsp;whether or not show verbose log on command line, default `false`.

## Contribution and Issues

Feel free to contribute code or publish an issue, if you has any good idea or find a bug.

## License

[MIT](./LICENSE)

## Author

Javen Leung
