# End-to-end testing Studio

Before you can run the tests you need to add a sesstion token
so the tests are able to log in.

Open the test studio in Chrome ou
would normally). Open the "Developer Console", navigate to

1. Open test studio in a browser (by running `npm start` as you
   normally would)
2. Open "Developer console" and find the value of the `sanitySession`
   cookie
3. Set the environment variable by running
   ```shell
   export CYPRESS_SANITY_SESSION_TOKEN='<...>'
   ```
   where you replace `<...>` with the value from step 2

Run the tests like so:

```
$ npm run test-e2e
```

Or open cypress for interactivity:

```
$ cypress open
```
