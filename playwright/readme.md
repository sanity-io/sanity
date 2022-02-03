# E2E Testing in the Studio

Before you get started with writing and running tests, you need to add a session token called `PLAYWRIGHT_SANITY_SESSION_TOKEN` to the `.env` file. See `.env.example` at the root of this repo for more info on where to find your session token.

## Running tests

Before you can run the tests, you need to start the Test Studio:

```
npm run dev
```

When the Test Studio is running, you can run all tests or only specific tests. Here are some helpful commands:

- Run all the tests

  ```
  npx playwright test
  ```

- Run all tests in specific directory

  ```
  npx playwright test tests/default-layout
  ```

- Run files that have my-spec or my-spec-2 in the file name

  ```
  npx playwright test my-spec my-spec-2
  ```

- For help, run
  ```
  npx playwright test --help
  ```

For more useful commands, see the [Playwright Command Line](https://playwright.dev/docs/test-cli) documentation.

### Running tests from your code editor

You can run your tests in your editor with the help of some useful editor plugins/extensions. For example, you can download `Playwright Test for VSCode` from Microsoft to show and run your tests in VSCode.

## Writing tests

### File names
