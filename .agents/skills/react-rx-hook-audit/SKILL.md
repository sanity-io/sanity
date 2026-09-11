---
name: react-rx-hook-audit
description: Find react-rx hook call sites (useObservable, useSyncObservable, useObservablePromise) whose observable identity churns or that re-render more than needed, verify the suspicion at runtime, and refactor them to the useValuePreview pattern. Use when reviewing or writing a component or hook that calls these hooks, when a re-render or resubscribe storm is suspected, or when preparing the react-rx 7 upgrade.
---

# react-rx hook audit

## Start here

Use when a component or hook calls `useObservable`, `useSyncObservable` or `useObservablePromise`,
when you suspect a re-render or resubscribe storm, or before the react-rx 7 upgrade.

Read the reference refactor `packages/sanity/src/core/preview/useValuePreview.ts` and its test
`packages/sanity/src/core/preview/__test__/useValuePreview.test.tsx` before you change a hook.

react-rx keeps one shared store per observable identity. A new identity is a new store and a new
subscription of the source on commit, even when the pipeline is the same.

- react-rx 6 (installed) subscribes a replacement observable once during render, so a synchronous
  emission shows in that render. Read the comments on `needsWarmUp` and `warmUp` in
  `packages/sanity/node_modules/react-rx/dist/index.js`. The resubscribe still happens, and an
  asynchronous source still shows `initialValue` first.
- react-rx 7 has no warm-up. Every identity change renders `initialValue` once and resubscribes on
  commit. `initialValue` is required and omitting it throws during render. `useObservableSubject`
  replaces `useObservableEvent`. Get the dist with `npm pack react-rx@7`.

## Find candidates

```bash
# run from the repo root; every call site (120 files at the time of writing)
rg -n "use(Sync)?Observable(Promise)?\(" packages/sanity/src packages/@sanity/vision/src -g '!**/*.test.*' -g '!**/__test*__/**'

# calls without an initialValue (28 hits; react-rx 7 throws on these)
rg -nU "use(Sync)?Observable\(\s*[^,()]+?\s*\)" packages/sanity/src packages/@sanity/vision/src -g '!**/*.test.*' -g '!**/__test*__/**'

# every useMemo in those files, reduced to its first line and its dependency array
rg -nU --multiline-dotall -o "useMemo(<[^>]*>)?\(\s*\(\)\s*=>.{0,900}?\n\s*\[[^\]\n]*\],?\s*\)" $(rg -l "use(Sync)?Observable(Promise)?\(" packages/sanity/src -g '!**/*.test.*' -g '!**/__test*__/**') | rg ":\d+:\s*(useMemo|\[)"

# files that call useObservablePromise and use(); confirm the two calls sit in different components
rg -l "useObservablePromise\(" packages/sanity/src packages/@sanity/vision/src -g '!**/*.test.*' | xargs rg -n "useObservablePromise\(|\buse\("
```

Read each dependency array from the third command. Flag a call site when:

- A `useMemo` dependency that changes on edits: a document value, an array or object built during
  render, an inline `[]` or `{}` prop, or a recreated context value.
- `of(...)` or a `.pipe(...)` is built inline in render or per memo run instead of hoisted.
- The dependency list is a superset of what the pipeline reads.
- `useObservable` or `useSyncObservable` is called without a stable `initialValue`.
- `use()` reads a promise from `useObservablePromise` in the same component. See "react-rx:
  `useObservablePromise` and `use()` live in different components" in `AGENTS.md`.

Check these first (found with the commands above at this commit):

- `packages/sanity/src/core/hooks/useUserListWithPermissions.ts`: `state$` lists `documentValue`,
  the live document from `CommentsProvider`. Every edit rebuilds the grants observable.
- `packages/sanity/src/core/form/studio/assetSourceMediaLibrary/hooks/useEnsureMediaLibrary.ts`:
  the memo lists `props`, and `MediaLibraryProvider.tsx` passes them as an inline object literal.
- `packages/sanity/src/core/canvas/actions/LinkToCanvas/useLinkToCanvas.ts`: the memo lists
  `document`. An edit while `LinkToCanvasDialog` is open reruns the preflight request.
- `packages/sanity/src/core/releases/tool/components/releaseCTAButtons/ReleaseRevertButton/usePostPublishTransactions.ts`:
  the memo lists `documents`, which updates live, so each update refetches the transaction log.

## Count renders at runtime

Start the daemon and the studio per `.agents/skills/react-devtools/SKILL.md` and `AGENTS.md`. Then:

```bash
pnpm --filter sanity-test-studio exec agent-react-devtools profile start
# drive the interaction, for example type ten characters into a field
pnpm --filter sanity-test-studio exec agent-react-devtools profile stop
pnpm --filter sanity-test-studio exec agent-react-devtools profile rerenders --limit 10
pnpm --filter sanity-test-studio exec agent-react-devtools profile report @cN
pnpm --filter sanity-test-studio exec agent-react-devtools get component @cN # hook slots
```

Limits: it counts renders, not subscriptions, so a resubscribe that renders the same value is
invisible. Hidden `<Activity>` trees show as repeated first-mount fibers, not as re-renders.

## Count subscriptions at runtime

1. Add a temporary `console.log('[rx:build] <hook>')` inside the observable factory (the `useMemo`)
   and a `console.log('[rx:subscribe] <hook>', <target id>)` inside the `switchMap` project or the
   source factory. Remove both before you commit.
2. Drive the studio with Playwright in headed Chrome and count the lines by tag. Snapshot the
   counters before and after the interaction. Run from the repo root with `node`:

```js
import {chromium} from 'playwright'

const counts = {}
const executablePath = '/usr/local/bin/google-chrome'
const browser = await chromium.launch({executablePath, headless: false})
const page = await browser.newPage()
page.on('console', (message) => {
  const [tag] = message.text().split(' ', 1)
  if (tag.startsWith('[rx:')) counts[tag] = (counts[tag] ?? 0) + 1
})
const token = encodeURIComponent(process.env.STUDIO_AUTH_TOKEN) // never log it
// an existing document in the /test workspace, for example one you created through the mutate API
await page.goto(`http://localhost:3333/test/structure/author;${process.env.DOC_ID}#token=${token}`)
const input = page.getByTestId('field-name').getByTestId('string-input')
await input.waitFor()
const before = {...counts}
await input.pressSequentially('ten chars!')
await page.waitForTimeout(3000)
console.log({before, after: counts})
await browser.close()
```

Pitfalls seen in this repo:

- `sanity dev` can serve a stale revision after two edits of one file within seconds. Confirm an
  `hmr update` line for your last edit in its terminal, or restart the server.
- Keep the studio in bundledDev (the default) but run the server with the PID watchdog from the
  `AGENTS.md` gotchas. On vite 8.3 (PR #14700) one audit session pushed the server past 7 GB RSS.

Pass condition: during edits, `[rx:build]` is 0 for every host whose identity inputs did not
change, and `[rx:subscribe]` equals the number of distinct input changes per host.

## Refactor

Reproduce the `useValuePreview` shape:

1. Name the identity inputs: the inputs whose change must render `initialValue` again. In
   `useValuePreview` these are `enabled`, `schemaType` and the previewed document id. Everything
   else is a streamed input.
2. Put the streamed inputs in one typed record (`PreviewInputs`) and `useMemo` it on its fields.
   One record, not one subject per input: two fields that change in the same render arrive
   together, so `switchMap` never subscribes an intermediate source.
3. Hold the record in a `BehaviorSubject` fed from a `useEffect`. Replace the subject whenever any
   identity input changes, `enabled` included, seeded with the current render's inputs, with the
   "adjust state during render" pattern. react-rx 6 warms up the replacement observable during
   render, so an old subject would make it preview the inputs of an earlier render. This is
   `useInputsSubject` in `useValuePreview.ts`:

   ```ts
   function useInputsSubject(
     enabled: boolean,
     schemaType: SchemaType | undefined,
     inputs: PreviewInputs,
   ): BehaviorSubject<PreviewInputs> {
     const documentId = getPreviewDocumentId(inputs.value)
     const [current, setCurrent] = useState(() => ({
       enabled,
       schemaType,
       documentId,
       inputs$: new BehaviorSubject(inputs),
     }))

     let {inputs$} = current
     if (
       current.enabled !== enabled ||
       current.schemaType !== schemaType ||
       current.documentId !== documentId
     ) {
       inputs$ = new BehaviorSubject(inputs)
       setCurrent({enabled, schemaType, documentId, inputs$})
     }

     useEffect(() => {
       inputs$.next(inputs)
     }, [inputs$, inputs])

     return inputs$
   }
   ```

4. Build the observable in a `useMemo` whose dependencies are the identity inputs, the subject and
   the store function only. Pipe `inputs$` through `distinctUntilChanged(dequal)`, `switchMap` into
   the source, then `distinctUntilChanged` with an output comparator (`isSameState` in
   `useValuePreview.ts`) that compares the value with `react-fast-compare` and errors by identity.
5. Hoist constant observables to module scope, as in `IDLE_STATE_OBSERVABLE = of(IDLE_STATE)`, so
   returning one from the memo keeps a single identity and store.
6. Keep `useSyncObservable(observable, INITIAL_STATE)` when consumers read the first frame
   synchronously. Use `useObservable` otherwise.

Cost the pattern accepts: a change that alters the output takes one extra render (render with the
previous snapshot, the effect pushes, the store notifies, render again). A change that leaves the
output equal costs no extra render.

Do not apply the pattern when the observable has no value-shaped inputs (ids, strings and stores
only) or when consumers need the render-time synchronous update on every change. Do not reach for
the deprecated `useUnique` to stabilize an input.

## Test

Copy the harness pattern from `useValuePreview.test.tsx` and assert on literal frames and counts:

- A `Harness` component pushes every rendered frame (`{isLoading, title, error}`) into an array.
- The mocked source is an `Observable` that counts `subscriptions.active` and `subscriptions.total`
  in its subscribe function and teardown.
- `flush()` awaits one macrotask inside `act`, so react-rx's
  `share({resetOnRefCountZero: () => timer(0, asapScheduler)})` releases the old source before you
  assert counts.

Write these three tests. They catch the regressions the refactor guards against:

1. Same target, edited twice: `frames.slice(settled).filter((frame) => frame.isLoading)` is `[]`
   and, after `flush()`, `subscriptions` is `{active: 1, total: 3}`.
2. Equal inputs rebuilt every render (a new `[]` prop or an equal object): `{active: 1, total: 1}`.
3. Identity change (another document or schema type): every frame since the switch is the loading
   frame, the previous target's title never renders, then the new title renders.

Run the file against the react-rx 7 dist to see which failures are v7-only. The installed dist
files are hard links into the pnpm store, so never write into them in place; unlink first:

```bash
RX=packages/sanity/node_modules/react-rx/dist
cp -a $RX /tmp/react-rx6-dist
rm $RX/index.js $RX/index.d.ts && cp /tmp/react-rx7/package/dist/index.js /tmp/react-rx7/package/dist/index.d.ts $RX/
pnpm vitest run --project=sanity <the test file>
rm $RX/index.js $RX/index.d.ts && cp /tmp/react-rx6-dist/index.js /tmp/react-rx6-dist/index.d.ts $RX/
```

At this commit `useValuePreview.test.tsx` passes under both dists; on `main`'s hook it fails 2 tests
under v6 and 6 under v7.
