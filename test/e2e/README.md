# E2E Testing in the Studio

## Required Env Variables

The tests expects to find the below env variables. Either define it in your shell, or add it to the `.env.local` file in the repository root.

- `SANITY_E2E_SESSION_TOKEN`: Before you get started with writing and running tests, you need to get hold of a token - either using your own Sanity user token (`sanity debug --secrets` will give you the CLI token provided you are logged in `sanity login`), or by creating a project API token using https://sanity.io/manage.
- `SANITY_E2E_PROJECT_ID`: Project ID of the studio
- `SANITY_E2E_DATASET`: Dataset name of the studio

Make sure that the project that you are running in the e2e tests allows the origin of your local studio (this is default **http://localhost:3339**) in https://sanity.io/manage > your project > API > Add CORS origin

## Running tests

To run E2E tests run the following commands from the root of the project

- Run all the tests

  ```sh
  pnpm test:e2e
  ```

- Run all tests in specific directory, it runs relative to the `test/e2e/tests`

  ```sh
  pnpm test:e2e tests/default-layout
  ```

- Run files that have my-spec or my-spec-2 in the file name

  ```sh
  pnpm test:e2e my-spec my-spec-2
  ```

- For help, run
  ```sh
  pnpm test:e2e --help
  ```

Other useful helper commands

- "e2e:dev": Starts the E2E studio using `sanity dev`
- "e2e:build": Runs `sanity build` on E2E studio
- "e2e:codegen": Runs [playwright codegen](https://playwright.dev/docs/codegen). **Note: Requires the studio to be running. Run `pnpm e2e:dev` in another terminal first**
- "e2e:start": Runs `sanity preview` on E2E studio (preview server, requires a build)
- "e2e:preview": Runs `sanity build`, then `sanity preview` on E2E studio

For more useful commands, see the [Playwright Command Line](https://playwright.dev/docs/test-cli) documentation.

### Running tests from your code editor

You can run your tests in your editor with the help of some useful editor plugins/extensions. For example, you can download `Playwright Test for VSCode` from Microsoft to show and run your tests in VSCode.
