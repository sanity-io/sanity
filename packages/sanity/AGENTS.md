# packages/sanity - unit test conventions

The root `AGENTS.md` owns the monorepo: install, build, CI checks, PR titles, and the React and jsdom traps that bite in these tests. This file owns the conventions specific to this package: where a test goes, which helper to reach for, and how to keep it deterministic.

Read these root sections before writing a test. They are the authority on their subject and are not repeated here:

| Root section                                                                        | Covers                                                                           |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Testing > Unit Tests (Vitest)                                                       | The commands, and why a build comes first                                        |
| Testing > Test Timeouts                                                             | The options-object form, not the deprecated third argument                       |
| Testing > Vanilla-extract in jsdom tests                                            | Why computed styles are unavailable, and asserting on `data-testid` instead      |
| Testing > @sanity/ui overlays stay mounted when closed                              | Closed overlays matching your queries, and the intent routes a test router needs |
| Testing > Testing components that suspend via `use()`                               | Mounting inside an awaited async `act`, and keeping the `use()` sequence stable  |
| Testing > react-rx: `useObservablePromise` and `use()` live in different components | Why that pair deadlocks in one component                                         |
| Testing > Custom matchers shipped in node_modules                                   | Putting the side-effect import in a setup file                                   |
| Coding Standards > react-rx: stable observables, explicit initial values            | Stable observable identity, and never relying on a synchronous first emission    |

## Runner and layout

- Vitest in jsdom. Config: `packages/sanity/vitest.config.mts`, registered as the `sanity` project in the root `vitest.config.mts`.
- Two test locations are both in use: colocated `Thing.test.ts(x)` beside the source, or a `__tests__/` directory beside it. `__tests__/` is the more common of the two. Match whichever the sibling files already use rather than introducing the other.
- Vitest globals are off. Import `describe`, `test`, `expect`, `vi`, `beforeEach` from `vitest` in every file.
- `typecheck.enabled` is on, so test files are type-checked as part of the run. `ignoreSourceErrors` suppresses errors originating in source files only, not in your test.
- `*.browser.test.tsx` is excluded from the default run and executes in real browsers via `pnpm --filter sanity test:browser`. Its harness components stay inline in the test file; a `*Story.tsx` belongs to Storybook instead.

## Coverage

From the repo root:

```bash
pnpm vitest run --project=sanity --coverage
```

The v8 provider writes `coverage/coverage-summary.json`. Only files executed by a test appear in it, so a source file absent from the report has no coverage at all - absence is the signal, not a zero percentage.

## Helpers

Prefer these over hand-rolled setup. Paths are relative to `packages/sanity/`.

| Helper                                                                                             | Where                                          | Use                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestProvider`                                                                               | `test/testUtils/TestProvider`                  | Async. Returns a provider wired with workspace, source, i18n, router, perspective, resource cache, copy-paste and limits context. Takes `{client, config, resources}`. The default way to render anything needing Studio context. |
| `getMockWorkspace`, `getMockSource`                                                                | `test/testUtils/getMockWorkspaceFromConfig`    | A resolved workspace or source without rendering.                                                                                                                                                                                 |
| `renderInput`, `renderStringInput`, `renderObjectInput`, `renderArrayOfObjectsInput`, and the rest | `test/form/`                                   | Per-type harnesses that mount a single form input with real form state. Reach for these before assembling a form by hand.                                                                                                         |
| `createMockSanityClient`                                                                           | `test/mocks/mockSanityClient`                  | Takes `{requests, requestCallback}` keyed by request URI, and records a transaction log. The browser suite has its own at `test/browser/createMockSanityClient`.                                                                  |
| `createMockAuthStore`                                                                              | `src/core/store/authStore/createMockAuthStore` | Auth context without a real session. Takes `{client, currentUser}`.                                                                                                                                                               |
| `mockUseRouter`, `mockUseRouterReturn`                                                             | `test/mocks/useRouter.mock`                    | Router state without a real router.                                                                                                                                                                                               |
| `mockUseDocumentPairPermissions`                                                                   | `test/mocks/useDocumentPairPermissions.mock`   | Permission gating.                                                                                                                                                                                                                |
| `createMockBifurClient`                                                                            | `test/mocks/mockBifur`                         | Presence and listener transport.                                                                                                                                                                                                  |
| `toMatchEmissions`                                                                                 | `test/matchers/toMatchEmissions`               | Custom matcher for an observable's emission sequence. Use it for anything RxJS rather than manual subscribe-and-collect.                                                                                                          |
| `setupVirtualListEnv`                                                                              | `test/testUtils/setupVirtualListEnv`           | Gives `@sanity/ui` virtualised lists a measurable viewport in jsdom.                                                                                                                                                              |
| `stubMessageBusHost`                                                                               | `test/testUtils/stubMessageBusHost`            | A real SDK message bus with a stubbed host, removed when the test finishes. `publish` state topics to every connection (later ones too), `capture` or `respond` to event topics.                                                  |
| `assetSourceMocks` fixtures                                                                        | `test/fixtures/assetSourceMocks`               | Stub file, image and video assets, and asset source plugins.                                                                                                                                                                      |
| `TestWrapper`, `testHelpers`                                                                       | `test/browser/`                                | The browser-mode equivalents, for `*.browser.test.tsx` only.                                                                                                                                                                      |
| `flushMicrotasksThisIsACodeSmell`                                                                  | `test/testUtils/flushMicrotasks`               | Last resort for components that `setState` from a promise inside an effect. Its own doc comment explains why fixing the component is the better move.                                                                             |

## Assertions

- Query by role, label or `data-testid`.
- Prefer behavioural assertions to snapshots. Snapshots live in `__snapshots__/` and are updated with `pnpm test -- -u`. Review every snapshot change.
- Name tests as statements of behaviour, not restatements of the function name.

## Determinism

Tests run sharded and in parallel in CI. They must be independent of each other and of the clock.

- Fake timers or an injected clock. No `Date.now()` in assertions, no real `setTimeout` waits.
- No network. Mock at the client boundary with `createMockSanityClient`.
- No shared mutable module state across files, and no reliance on test order.
- Reset mocks between tests. `mockClear()` in `beforeEach` paired with `vi.clearAllMocks()` in `afterEach` is the established pattern here.

## Mocking

- `vi.mock` with an explicit factory at the top of the file.
- Mock the boundary the unit owns - the hook, the client, the store it consumes - not several layers beneath it.
- A test that needs five layers mocked is a signal the unit is doing too much. Prefer testing a smaller seam.

## Scope

This file applies to `packages/sanity`. Sibling packages (`@sanity/schema`, `@sanity/mutator`, `@sanity/types`, `@sanity/util`, `@sanity/validation`, `@sanity/vision`) have their own suites registered in the same root project list. `@repo/*` packages are internal tooling and are excluded from coverage.
