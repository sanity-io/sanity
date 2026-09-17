# packages/sanity - unit test conventions

Read this alongside the root `AGENTS.md`, which covers install, build, CI checks and PR titles for the whole monorepo. This file covers how unit tests are written in the core Studio package.

## Runner and layout

- Vitest in jsdom. Config: `packages/sanity/vitest.config.mts`, registered as the `sanity` project in the root `vitest.config.mts`.
- Two test locations are both in use: colocated `Thing.test.ts(x)` beside the source, or a `__tests__/` directory beside it. Match whichever the sibling files already use rather than introducing the other.
- Vitest globals are off. Import `describe`, `test`, `expect`, `vi`, `beforeEach` from `vitest` in every file.
- `typecheck.enabled` is on, so test files are type-checked as part of the run. `ignoreSourceErrors` suppresses errors originating in source files only, not in your test.
- `*.browser.test.tsx` is excluded from the default run. Those execute in real browsers via `pnpm --filter sanity test:browser`. Anything that depends on layout, computed styles or real pointer behaviour belongs there.

## Running

A build is required first, because some tests import compiled output:

```bash
pnpm build && pnpm test
```

Single file or directory:

```bash
pnpm vitest run --project=sanity packages/sanity/src/core/hooks/useClient.test.ts
pnpm vitest run --project=sanity --reporter=verbose <path>
```

Do not use `pnpm test -- <path>`. It runs every test in every project.

Coverage, from the repo root:

```bash
pnpm vitest run --project=sanity --coverage
```

The v8 provider writes `coverage/coverage-summary.json`. Only files executed by the tests appear in it, so a source file absent from the report has no coverage at all.

## Helpers

Prefer these over hand-rolled setup. They live in `packages/sanity/test/`.

| Helper                                 | Where                                        | Use                                                                                                                                                                                                                               |
| -------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestProvider`                   | `test/testUtils/TestProvider`                | Async. Returns a provider wired with workspace, source, i18n, router, perspective, resource cache, copy-paste and limits context. Takes `{client, config, resources}`. The default way to render anything needing Studio context. |
| `getMockWorkspace`, `getMockSource`    | `test/testUtils/getMockWorkspaceFromConfig`  | A resolved workspace or source without rendering.                                                                                                                                                                                 |
| `createMockSanityClient`               | `test/mocks/mockSanityClient`                | Takes `{requests, requestCallback}` keyed by request URI, and records a transaction log.                                                                                                                                          |
| `mockUseRouter`, `mockUseRouterReturn` | `test/mocks/useRouter.mock`                  | Router state without a real router.                                                                                                                                                                                               |
| `mockUseDocumentPairPermissions`       | `test/mocks/useDocumentPairPermissions.mock` | Permission gating.                                                                                                                                                                                                                |
| `createMockBifurClient`                | `test/mocks/mockBifur`                       | Presence and listener transport.                                                                                                                                                                                                  |
| `toMatchEmissions`                     | `test/matchers/toMatchEmissions`             | Custom matcher for asserting an observable's emission sequence. Use this for anything RxJS rather than manual subscribe-and-collect.                                                                                              |
| `setupVirtualListEnv`                  | `test/testUtils/setupVirtualListEnv`         | Gives `@sanity/ui` virtualised lists a measurable viewport in jsdom.                                                                                                                                                              |
| `assetSourceMocks` fixtures            | `test/fixtures/assetSourceMocks`             | Stub file, image and video assets, and asset source plugins.                                                                                                                                                                      |
| `flushMicrotasksThisIsACodeSmell`      | `test/testUtils/flushMicrotasks`             | Last resort for components that `setState` from a promise inside an effect. Its own doc comment explains why fixing the component is the better move.                                                                             |

## Assertions

- Query by role, label or `data-testid`.
- Never assert on vanilla-extract class names or computed styles. `test/setup/environment.ts` disables vanilla-extract runtime styles, so class identifiers resolve but no styles are applied. Style behaviour belongs in the browser-mode suite or the Playwright e2e tests.
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

This file applies to `packages/sanity`. Sibling packages (`@sanity/schema`, `@sanity/mutator`, `@sanity/types`, `@sanity/util`, `@sanity/vision`) have their own suites registered in the same root project list. `@repo/*` packages are internal tooling and are excluded from coverage.
