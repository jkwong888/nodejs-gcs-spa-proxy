const {Storage} = require('@google-cloud/storage');
const https = require('https');

// Creates a client
const storage = new Storage();
// Creates a client from a Google service account key.
// const storage = new Storage({keyFilename: "key.json"});
// For more information on ways to initialize Storage, please see https://googleapis.dev/nodejs/storage/latest/Storage.html

const GOOGLE_STORAGE_URL = 'storage.googleapis.com';
const GOOGLE_STORAGE_PORT = 443;
const GOOGLE_BUCKET_NAME = process.env.GCS_BUCKET_TO_PROXY;

async function sendIndexHtml(res) {
  const bucket = storage.bucket(GOOGLE_BUCKET_NAME);

  const [bucketMetadata] = await bucket.getMetadata();

  https.get({
    hostname: GOOGLE_STORAGE_URL,
    port: GOOGLE_STORAGE_PORT,
    path: GOOGLE_BUCKET_NAME + '/' + bucketMetadata.website.mainPageSuffix,
  }, ((proxyresp) => {
    // always return 200
    res.status(200).set(proxyresp.headers)

    proxyresp
      .on('err', (err) => {
        if (err.code == 404) {
          sendIndexHtml(res);
        } else {
          console.error(err);
        }
      })
      .on('end', () => {
        res.end();
      })
      .pipe(res);
  }))
}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.gcsproxy = (req, res) => {
  //console.log("path to proxy: " + req.path);

  // chop off any leading /'s
  const path  = req.path.replace(/^\/*/, '');
  //console.log("find file: " + path);

  if (path === '') {
    sendIndexHtml(res);
    return;
  }

  https.get({
    hostname: GOOGLE_STORAGE_URL,
    port: GOOGLE_STORAGE_PORT,
    path: GOOGLE_BUCKET_NAME +  req.path,
  }, ((proxyresp) => {
    // always return 200
    res.status(200).set(proxyresp.headers)

    proxyresp
      .on('err', (err) => {
        if (err.code == 404) {
          // send 200 with main webpage if the path doesn't exist
          sendIndexHtml(res);
        } else {
          // some other error happened
          console.error(err);
        }
      })
      .on('end', () => {
        res.end();
      })
      .pipe(res);
  }))
};

// standalone serving for testing below
const express = require('express')
const app = express()
const port = 3000

app.get('*', exports.gcsproxy);

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening at http://0.0.0.0:${port}`)
})