# nodejs-gcs-spa-proxy

GCS proxy front end you can host on Cloud Run for Single Page Apps.  This will mostly serve what's in GCS, the only difference is if we point at a resource that isn't there (e.g. a deep link), the proxy returns the main page (e.g. `index.html`) and returns HTTP 200.  We use CDN to cache the responses except for `index.html` to reduce the number of invocations on this function.

1. Create a bucket and push your code there.
   1. in command line, set the [specialty pages](https://cloud.google.com/storage/docs/hosting-static-website#specialty-pages), e.g.

      ```
      gsutil web set -m index.html -e 404.html gs://my-static-assets
      ```

   1. push your compiled code to the bucket 
   1. make sure the main page has the header `Cache-control: no-store` so CDN won't cache it.  All other pages will be cached for 3600 seconds by default.

1. Deploy this repo to cloud run
   1. set the environment variable: `GCS_BUCKET_TO_PROXY` to your GCS bucket (musst be a public bucket, add `allUsers` as `Storage Object Reader` to make your bucket public)
   1. Under triggers, since all access is through the load balancer, you can set it to allow only internal traffic and traffic from Cloud Load Balancing.

1. Create a Load Balancer with serverless NEGs for the cloud run instance
   1. Ensure the "Enable CDN" checkbox is checked, and check "use origin headers" for Cache Mode.
   1. optionally set up the listener as HTTPS, etc

