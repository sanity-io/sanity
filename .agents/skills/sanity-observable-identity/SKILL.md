---
name: sanity-observable-identity
description: Keep observable identities render-stable in React code that subscribes via react-rx (useObservable, useSyncObservable, useObservablePromise, useLoadable, createHookFromObservableFactory). Use when writing or reviewing hooks/components that build RxJS observables in render, when adding hook parameters that are arrays/objects/functions feeding an observable memo, or when investigating render loops, resubscription churn, or redundant refetches in the studio.
---

# Stable Observable Identity (react-rx)

## The rule

An observable handed to react-rx must keep the **same identity across renders** unless a
semantic input actually changed. react-rx keys its internal store cache on the observable
reference (a WeakMap), so a new identity means: new store entry, warm-up subscription, teardown
and resubscription of the old pipeline — and under react-rx v5, in the worst case a
**self-sustaining render loop**.

Real incident: `useDocumentValues(id, ['title'])` memoized its observable on the `paths` array
reference. An inline literal from an uncompiled caller busted the memo every render — ~60 update
passes/second, sustained, studio-wide slowdown (fixed in e089afde26, `useShallowUnique`).

## Why a new identity per render loops (v5) or churns (v6+)

- Under react-rx v5, `useObservable` wraps each snapshot as `{observable, value}` and passes it
  through `useDeferredValue` (identity-coherent deferral). A new observable identity schedules a
  deferred re-render pass; that pass runs the component body again, which mints another
  identity, which schedules another pass — forever. The emitted **values being equal does not
  help**; the wrapper's `observable` field alone sustains the loop.
- react-rx v6 (adopted via #14234) skips the warm-up for replacement observables after a first
  emission and re-subscribes them during render, so rebuild-every-render consumers **converge
  instead of looping**. The rule still stands: stable identity means exactly one subscription
  for the hook's lifetime; identity churn still tears down and rebuilds the pipeline.
- `useSyncObservable` has no deferral, but each new identity is a fresh store entry. Pipelines
  that `map` emissions into fresh objects (`{isLoading, value}` wrappers) then present a changed
  snapshot on resubscription — sustained rebuild/refetch churn.
- `useObservablePromise` creates a fresh **pending promise** per identity — `use()` consumers
  re-suspend on every render.
- Even when nothing loops, every identity change tears down and resubscribes the pipeline. For
  cold observables (`client.observable.request`, `getTransactionsLogs`, validation pipelines)
  that is a redundant network request per render.

## The two failure shapes

1. **Self-minted (loop-capable):** the unstable reference is created in the same component/hook
   whose render the deferred pass repeats — inline args at a hook call site
   (`useValuePreview({value: {_id}})`), values computed in render (`pathFromString(param)`),
   or `.pipe(...)` / `of(...)` / `new Subject()` in the render body.
2. **Parent-minted (churn amplifier):** an unstable prop from a parent
   (`<SearchPopover previewPerspective={[releaseId]} />`). The child's deferred pass reuses the
   same props, so it converges — but every parent render rebuilds and refetches every downstream
   subscription.

## Do not rely on the React Compiler

The published `sanity` package and compiler-enabled studios auto-memoize in-render construction,
which _masks_ shape 1 — until it doesn't:

- The compiler **bails out silently** on whole components/hooks (mutations, unsupported
  patterns). The unmemoized shape then goes live with no warning.
- **External callers are not compiled.** Customer studio code and plugins call our exported
  hooks with inline literals; the compiler on our side cannot stabilize _arguments_. This is how
  the useDocumentValues incident shipped. Hook parameters must be stabilized **inside the hook**.

Write explicit memoization; treat compiler coverage as a bonus, never as the defense.

## How to write it

| Input feeding an observable memo                                      | Do this                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives (`id`, `type`, `permission`)                               | Plain `useMemo` dep. Prefer deriving primitives from objects (`value?._ref`, `currentUser?.id`) when only those matter.                                                                                  |
| Array / plain-object hook param (`paths`, `params`, options objects)  | `useShallowUnique(param)` before using it as a dep — keys the memo on contents.                                                                                                                          |
| Document values                                                       | `useShallowUnique` works, or key on `_id`/`_rev` when content is not needed.                                                                                                                             |
| Function param (`getReferenceInfo`, `observeAsset`, `skipValidation`) | Require a stable identity from callers (`useCallback`); document it. `useShallowUnique` compares functions by identity, so it neither helps nor hurts. Do not silently drop function identity from deps. |
| Constant fallback branches                                            | Module-level constants: `const DISABLED$ = of(false)`, `EMPTY_ARRAY`, a memoized `{context, observable}` pair — never a fresh `of(...)` / `new Subject()` per render.                                    |
| Whole pipelines in render                                             | Always wrap `.pipe(...)` in `useMemo` keyed per this table. Store-owned pipelines can also be cached in the store itself (`shareReplay` + per-args map).                                                 |

Canonical examples: `useDocumentValues`, `useValuePreview`, `createHookFromObservableFactory`
(stabilizes its `arg` for every hook created from it), `useCanInviteProjectMembers`.

`useShallowUnique` notes: equality is `dequal/lite` — plain objects and arrays compare deeply,
Date/RegExp by value, everything else (functions, Map, Set, class instances) effectively by
identity. It is **deliberately not exported from `sanity`** (implementation detail, not public
API): `src/core` imports `core/util/useShallowUnique`, `src/structure` keeps a synced local copy
at `structure/hooks/useShallowUnique` because the architectural boundaries forbid
structure → core internal imports, and separate packages (e.g. `@sanity/vision`) cannot use it —
key their memos on primitives instead. `useUnique` (lodash `isEqual`) is the deprecated escape
hatch — avoid in new code.

## Fresh-per-call vs internally cached factories

Calling these in render without a memo mints a new identity **every render**:
`observePaths`, `observeForPreview`, `getPreviewStateObservable`, `listenSearchQuery`,
`presenceStore.documentPresence`, `getTemplatePermissions`, `keyValueStore.getKey`,
`client.observable.request(...)`, and anything you `.pipe(...)` yourself.

These cache internally per args (stable identity for equal args — still memoize the _outer_
pipe if you add one): `editState` / `snapshotPair` / `validation` / `operationEvents`
(memoized), `getDocumentAtRevision` (revision cache), `unstable_observeDocument`
(`shareReplay`), `collateDocumentDivergences` / `readMostRecentSharedTransaction` (LRU),
`UserColorManager.listen`, `getFeatures` / `getProjectGrants` (per client/project),
`getBundleDocumentsObservable` (by `cacheKey`).

When in doubt, read the factory: if it ends in a bare `.pipe(...)` with no cache in front, it is
fresh per call.

## Review checklist (grep signals)

- `useObservable(`, `useSyncObservable(`, `useObservablePromise(`, `useLoadable(` — trace how the
  argument is constructed; anything not from a module constant, store property, or `useMemo` is
  suspect.
- `.pipe(`, `of(`, `new Subject(`, `new BehaviorSubject(` in a component/hook **render body**
  outside `useMemo`.
- `useMemo` dep arrays containing reference-typed hook params or props (arrays, options objects,
  documents, callbacks) — check every call site for inline literals, `.map()` results, defaults
  like `= []`.
- Inline literals at call sites of subscription-backed hooks (`useValuePreview({value: {...}})`,
  `perspectiveStack: [...]`, `previewPerspective={[x]}`).
- `useEffect(() => x$.subscribe(...), [x$])` where `x$` is rebuilt per render — same identity
  class, resubscribe churn.
- New exported hooks taking arrays/objects/functions that feed observables — stabilize inside the
  hook; external callers will pass inline literals.

## Regression-test recipe

Copy the pattern from
`packages/sanity/src/core/store/document/hooks/__tests__/useDocumentValuesRenderLoop.repro.test.tsx`
(also: `createHookFromObservableFactoryRenderLoop.repro.test.tsx`,
`useValuePreviewRenderLoop.repro.test.tsx`, `useCanInviteMembersRenderLoop.repro.test.tsx`):

1. Mock the store factory as `vi.fn(() => cached$.pipe(map((v) => v)))` over a `BehaviorSubject`
   — fresh identity per call, synchronous replay, like the real stores.
2. Mount a probe that passes the footgun shape (inline literal) via a **raw `createRoot`** with
   `IS_REACT_ACT_ENVIRONMENT = false` (`act` would flush and mask the loop's scheduling). The
   probe increments a module-level render counter (the mutation also makes the compiler skip the
   probe, modeling uncompiled callers).
3. `root.render(...)`, sleep ~50ms, `root.render(...)` again (the second render is the kick that
   closes deferred loops), sleep ~500ms; assert the counter stayed small (< 10) and the factory
   was called once.
4. Assert content-keyed rebuilds: re-render with an equal-content new reference (no new factory
   call), then with different contents (one new call).
5. Assert emissions still propagate (`cached$.next(...)` reaches the DOM) so the stabilization
   cannot over-dedupe.

Note: the vitest pipeline runs the React Compiler over `packages/*/src`, so a pre-fix loop only
reproduces when the unstable reference comes from a bailed-out/uncompiled caller (the probe) —
in-render construction inside a successfully compiled hook is masked there.
