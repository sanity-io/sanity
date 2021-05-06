# Perf tracking for studio

Before you can run the perf tests you need to add a session token, so the tests are able to log in. See .env.example on the root of this repo for more info about how to set the required `PERF_STUDIO_SANITY_WRITE_TOKEN` and `PERF_TEST_SANITY_SESSION_TOKEN` environment variables.

Run the perf tests like so:

```
$ npm run test-perf
```

