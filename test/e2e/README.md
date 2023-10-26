# E2E Testing in the Studio

## Required Env Variables

The tests expects to find the below env variables. Either define it in your shell, or add it to the `.env.local` file in the repository root.

- `SANITY_E2E_SESSION_TOKEN`: Before you get started with writing and running tests, you need to get hold of a token - either using your own Sanity user token (`sanity debug --secrets` will give you the CLI token provided you are logged in `sanity login`), or by creating a project API token using https://sanity.io/manage.
- `SANITY_E2E_PROJECT_ID`: Project ID of the studio
- `SANITY_E2E_DATASET`: Dataset name of the studio

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
