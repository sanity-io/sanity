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

- Run all tests in specific directory, it runs relative to the `e2e/tests`

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

### Studio error watcher

Every spec that uses the `test` fixture from `studio-test.ts` runs under `watchForStudioErrors` (`helpers/studioErrors.ts`), which watches every page of the test's browser context. It fails the test on an uncaught page error and on a rendered studio error screen as soon as they happen. Use `expectError(matcher)` when a spec deliberately triggers one. Specs that import `test` from `@playwright/test` directly (the auth specs) get the same watcher by calling `watchEachTestForStudioErrors(test)`.

The watcher leaves out child frames of another origin than their page (`helpers/foreignFrames.ts`). The Presentation preview is one: the e2e studio loads it from the deployment of `dev/preview-iframe`, which is built from `main`, so nothing a pull request changes runs in it. Its uncaught errors, development-build warnings and DOM prop leaks are therefore not reported, and a fix to the preview only takes effect in the suite once it is deployed. The studio's own errors still fail the test while such a frame is open, including those it throws when it reaches into the frame. `tests/studio-errors/foreignFrames.spec.ts` checks both.

#### DOM prop leak guard

The watcher also fails a test, at its end, when a prop that is not a DOM attribute reached a DOM element during it: `<Button {...props} as="a">` forwarding `intent` and `params` to the `<a>`, a styled tag forwarding `isOpen`, and so on. react-dom and styled-components only warn about these in their development builds, and CI runs the suite against a production `sanity build`, so the watcher does not rely on the warnings. It installs a scanner (`helpers/domPropLeaks/scanner.ts`) in every document, which reads the props React keeps on each element (`__reactProps$…`, present in production builds too) and checks them against:

- react-dom's development-build prop validation (`React does not recognize the ... prop on a DOM element`, `Received true for a non-boolean attribute`, invalid event handler, ARIA and attribute names), ported with the same messages. The rules and name tables are read from the studio's installed `react-dom`, and unit tests check the port against react-dom itself;
- styled-components' check for elements a styled tag rendered, with the `@emotion/is-prop-valid` it warns with;
- objects, which React writes as `[object Object]`, and plain lowercase names that are not HTML or SVG attributes (`intent="edit"`), which React writes without any warning.

Against `sanity dev`, the watcher also collects the react-dom and styled-components warnings themselves, which cover a few things the scanner does not look at, such as `style` values.

A failure lists each prop with the element, the components that rendered it (outermost first) and the URL. This one is from `tests/desk/defaultPanes.spec.ts` against a production build, for a leak that `IntentButton` used to have while the permissions of a pane's create button loaded:

```
- `intent` on <a> [styled-components]
  styled-components: it looks like an unknown prop "intent" is being sent through to the DOM, which will likely trigger a React console error.
  rendered by: PaneHeaderCreateButton > InsufficientPermissionsMessageTooltip > Tooltip > IntentButton > Button > Tooltip > ButtonComponent > StyledButton
  element: <a data-ui="Button" intent="create" params="[object Object]" aria-label="Many views" data-testid="action-intent-button" role="link" aria-disabled="true" ...>
  url: http://localhost:3339/chromium/content/input-debug;manyViews
```

Fix the component closest to the element that receives the prop but does not use it: destructure the prop before spreading the rest onto the element, or make it a transient `$prop` when it is only for a styled tag's CSS. If the guard reports a name that is a real attribute, add it to `EXTRA_ATTRIBUTES` in `helpers/domPropLeaks/vocabulary.ts`. A name that a dependency writes on purpose, like the `zindex="-1"` the Portable Text editor sets on its editable root, goes in `DELIBERATE_ATTRIBUTES` in the same file, together with a prop that marks the element it is written on. Names that React lists as an attribute of any element are only reported for objects and for values React warns about, so `axis="y"` on a `<div>` (an attribute of table cells) passes. `tests/studio-errors/domPropLeakGuard.spec.ts` checks that the guard works against the build under test.

### Running tests from your code editor

You can run your tests in your editor with the help of some useful editor plugins/extensions. For example, you can download `Playwright Test for VSCode` from Microsoft to show and run your tests in VSCode.

## CI reports

On pull requests, CI posts an **E2E Tests** status comment with pass/fail/flaky/skipped counts, a hosted HTML report URL, and a link to the workflow run.

### Agent-friendly failure report

The HTML report is a JS single-page app — useful for humans, but an AI agent fetching the URL only gets an empty shell. So the report deployment also hosts **`<report-url>/agent-report.md`**: a plain-markdown digest generated by [`reporters/summary.ts`](./reporters/summary.ts) during `merge-reports`, containing each test that still failed after every retry:

- the full error message, stack, and failing code snippet (ANSI-stripped)
- Playwright's `error-context.md` attachment — an ARIA/YAML snapshot of the page at the moment of failure, designed for AI consumption
- the exact command (env vars included) to re-run the failed specs locally

When tests fail, the PR comment includes a **Share with an AI agent** fenced prompt pointing at that URL — GitHub's copy button copies the whole prompt in one click, so you can paste it into an agent chat to hand over everything needed to debug the run in a single request. The same digest is appended to the workflow run's job summary, and shipped in the HTML report GitHub artifact. When everything passes, the file still exists with a one-line "all passed" body so the URL is always valid.
