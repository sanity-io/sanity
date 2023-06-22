# E2E Testing in the Studio

Before you get started with writing and running tests, you need be a member of the e2e studio and get hold of a token - either using your own Sanity user token (`sanity debug --secrets` will give you the CLI token), or by creating a project API token using https://sanity.io/manage. Reach out to the team to receive an invitation to the e2e studio.

The tests expects to find the token in an environment variable named `SANITY_E2E_SESSION_TOKEN`. Either define it in your shell, or add it to the `.env.local` file in the repository root.

## Running tests

You can run tests in the studio in two ways: from the command line, or from your code editor. From the command line, you can run tests from the root of the repository, or from the `dev/e2e-studio` directory.

### Running tests from the command line

To run tests from the root, run `yarn e2e:test`. This will run all tests in the `dev/e2e-studio` directory. For more control of which tests to run, run tests from the `dev/e2e-studio` directory. See the instructions below for more information. If you run into problems, reach out to your team mates for help. There are no stupid questions!

- Run all the tests (from the dev/e2e-studio directory)

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

See the developer guidelines on Notion for more information on how to write tests and our style guide and conventions.
