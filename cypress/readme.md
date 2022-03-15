# End-to-end testing Studio

Before you can run the tests you need to add a session token so the tests are able to log in. See .env.example on the root of this repo for more info about how to set the required `CYPRESS_SANITY_SESSION_TOKEN` environment variable.

Run the tests like so:

```
$ yarn test-e2e
```

Or open cypress for interactivity:

```
$ yarn cypress:open
```
