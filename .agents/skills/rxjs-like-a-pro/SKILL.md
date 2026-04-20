---
name: rxjs-like-a-pro
description: >
  How to write idiomatic, efficient RxJS code. Use this skill whenever the user is writing, refactoring,
  reviewing, or debugging code that uses RxJS — including any file that imports from 'rxjs' or 'rxjs/operators'.
  Trigger on mentions of observables, subscriptions, RxJS operators, or reactive streams. Even if the user
  doesn't say "RxJS" explicitly, activate when you see patterns like `.pipe()`, `.subscribe()`, `Observable`,
  `Subject`, `BehaviorSubject`, `switchMap`, `mergeMap`, or similar.
---

# RxJS Like a Pro

This skill helps you write RxJS code that is idiomatic, composable, and free of common pitfalls. The core
philosophy: **keep logic in the observable chain**. Every time you reach for `.subscribe()`, ask whether the
work could instead be expressed as a transformation inside `.pipe()`.

## Reference files

For detailed examples and patterns, read the relevant reference file:

- `references/loading-state-patterns.md` — Deriving loading/error state in the chain, the `withLoadingState`
  custom operator, and using `scan` to preserve previous results across loading states. Read when working with
  async data fetching that needs loading indicators.
- `references/massive-observable.md` — How to refactor bloated `new Observable()` constructors into small
  focused pieces. Read when you see a `new Observable` callback longer than ~10 lines.
- `references/inner-observable-chains.md` — Building rich inner observable sequences with timing, delays, and
  animation phases. Read when composing multi-step async sequences or replacing `setTimeout` patterns.
- `references/custom-operators.md` — How to write inline and extracted custom operators with `OperatorFunction`.
  Read when extracting reusable stream logic.

## The #1 Anti-pattern: Premature Subscribe

The most common RxJS mistake is subscribing too early and then doing imperative work inside the callback —
tracking state in variables, calling functions with side effects, or worse, subscribing to _another_ observable
inside the callback (the "subscribe-in-subscribe" pattern).

Why this matters: when you subscribe early, you lose the power of the reactive chain. You can no longer
compose, retry, cancel, debounce, or share that work. You've escaped from the declarative world into
imperative spaghetti, and every new requirement (add a retry, add a timeout, combine with another stream)
means more manual state management.

```typescript
// ❌ Bad: subscribe-in-subscribe with manual state tracking
let currentData: Data | null = null
let loading = false

input$.subscribe((value) => {
  loading = true
  fetchData(value).subscribe((data) => {
    currentData = data
    loading = false
  })
})

// ✅ Good: everything is in the chain
const data$ = input$.pipe(switchMap((value) => fetchData(value)))
```

For loading state, derive it inside the chain using `startWith` — see `references/loading-state-patterns.md`.

## The Massive `new Observable()` Antipattern

Another common antipattern is stuffing an entire program into a single `new Observable(subscriber => { ... })`
constructor — setting up listeners, resolving promises, subscribing to other observables, managing retry
state, all in one giant callback. This is imperative code wearing an Observable costume.

The `new Observable()` constructor should be small and focused — a thin bridge from _one_ non-reactive source
into the reactive world. For promise-based sources, use `defer(() => promise)` instead. Retry logic, error
handling, combining sources — all of that belongs in the operator chain.

See `references/massive-observable.md` for a full before/after example.

## Choosing the Right Flattening Operator

| Operator     | Behavior                                      | Use when                                                                       |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `switchMap`  | Cancels previous inner when new value arrives | User input, search-as-you-type, route changes — only the latest matters        |
| `mergeMap`   | Runs all inner observables concurrently       | Independent operations where all results are needed (logging, fire-and-forget) |
| `concatMap`  | Queues inner observables, runs in order       | Order matters and nothing should be dropped (sequential writes, queues)        |
| `exhaustMap` | Ignores new values while inner is running     | Preventing duplicate submissions (form submit clicks)                          |

Default to `switchMap` for most UI/request scenarios.

The inner observable doesn't have to be a single request — it can be an entire timeline of events using
`concat`, `merge`, `timer`, `delay`. See `references/inner-observable-chains.md` for animation and timing
examples.

## Error Handling

Put `catchError` on the _inner_ observable when you want the outer stream to keep running. Put it on the
outer stream only when you truly want to replace the entire stream on error:

```typescript
// ❌ Bad: catchError on outer stream kills it for good
source$.pipe(
  switchMap((value) => fetchData(value)),
  catchError((err) => of(fallback)),
)

// ✅ Good: catchError inside switchMap — outer stream survives
source$.pipe(switchMap((value) => fetchData(value).pipe(catchError((err) => of(fallback)))))
```

Same principle applies to `retry` — retry the inner operation, not the entire outer stream:

```typescript
source$.pipe(
  switchMap((value) =>
    fetchData(value).pipe(
      retry({count: 3, delay: 1000}),
      catchError((err) => of(fallback)),
    ),
  ),
)
```

## Avoiding Memory Leaks

The fewer manual subscriptions, the fewer chances to leak. In order of preference:

1. **Don't subscribe at all** — let the framework handle subscription lifecycle where possible
2. **Use operators that complete naturally** — `first()`, `take(n)`, `takeUntil(destroy$)`
3. **Use `takeUntil` with a notifier**:

```typescript
const destroy$ = new Subject<void>();
someObservable$.pipe(
  takeUntil(destroy$),
).subscribe(value => /* ... */);

// In teardown: destroy$.next(); destroy$.complete();
```

**`takeUntil` must be the last operator in the pipe.** Operators after it (especially flattening operators)
can create inner subscriptions that `takeUntil` doesn't know about, causing leaks.

4. **Compose into a single subscription** — if you have multiple independent streams with side effects,
   `merge` them into one and subscribe once.

## Hot vs Cold

- **Cold** observables (`new Observable(...)`, `of()`, HTTP requests) create a new execution per subscriber
- **Hot** observables (`Subject`, `fromEvent`) share a single execution

Share cold observables with `shareReplay({ bufferSize: 1, refCount: true })`. Always use `refCount: true` —
without it, the source subscription stays alive after all subscribers unsubscribe (memory leak).

## Deriving State Reactively

Instead of mutable variables updated from multiple subscriptions, derive state from streams:

```typescript
// ❌ Bad: mutable state, inconsistent windows
let items: Item[] = []
let filter = ''
items$.subscribe((i) => {
  items = i
  recompute()
})
filter$.subscribe((f) => {
  filter = f
  recompute()
})

// ✅ Good: always consistent
const filteredItems$ = combineLatest([items$, filter$]).pipe(
  map(([items, filter]) => items.filter((item) => item.name.includes(filter))),
)
```

**`combineLatest` vs `withLatestFrom`**: `combineLatest` emits when _any_ input emits (all inputs drive
output). `withLatestFrom` emits only when the _source_ emits (one driver, others are context).

**`startWith`**: `combineLatest` won't emit until every input has emitted at least once. Use `startWith` to
provide initial values and unblock the stream.

## Subjects: Use Sparingly

`Subject`, `BehaviorSubject`, `ReplaySubject` are escape hatches for bridging imperative and reactive code.
Appropriate for event buses and bridging callbacks. _Not_ appropriate as general-purpose state containers —
if you're calling `.next()` in multiple places to keep a Subject in sync, use a derived stream instead.

## Custom Operators

Don't be afraid to write them — they're just functions with the signature
`(source: Observable<A>) => Observable<B>`. Extract repeated `.pipe()` chains into named operators with
`OperatorFunction<In, Out>`. See `references/custom-operators.md` for inline and extracted examples.

## Side Effects Belong in `tap`, Not in `subscribe`

A good rule of thumb: `.subscribe()` should have no arguments. All side effects — logging, updating the DOM,
writing to a database, sending analytics — belong in `tap` inside the chain. The `.subscribe()` at the end
just activates the stream.

```typescript
// ❌ Bad: side effects crammed into subscribe
source$.pipe(switchMap((value) => fetchData(value))).subscribe(
  (data) => {
    updateUI(data)
    logAnalytics('data_loaded', data)
    cache.set(data)
  },
  (err) => showError(err),
)

// ✅ Good: side effects in tap, subscribe just activates
source$
  .pipe(
    switchMap((value) => fetchData(value)),
    tap((data) => updateUI(data)),
    tap((data) => logAnalytics('data_loaded', data)),
    tap((data) => cache.set(data)),
    tap({error: (err) => showError(err)}),
  )
  .subscribe()
```

Why this matters: when side effects are in the chain, they're composable. You can add, remove, or reorder
them. You can put a `filter` between them. You can share the stream and have different subscribers without
duplicating side-effect logic. When everything is stuffed into `.subscribe()`, you've lost all of that.

`tap` also accepts an observer object with lifecycle hooks — particularly useful for debugging:

```typescript
source$.pipe(
  tap({
    subscribe: () => console.log('subscribed!'),
    next: (value) => console.log('value:', value),
    error: (err) => console.log('error:', err),
    complete: () => console.log('complete'),
    unsubscribe: () => console.log('unsubscribed'),
    finalize: () => console.log('finalized (complete or unsubscribe)'),
  }),
)
```

The `subscribe` hook is especially handy for debugging "why isn't my stream emitting?" — it confirms whether
anything is actually subscribing.

## Avoid Unnecessary Promise Conversion

`firstValueFrom`/`lastValueFrom` are appropriate for one-shot interop with promise-based APIs. They're a code
smell when used inside subscribe callbacks to avoid learning the reactive approach — that work belongs in the
chain with `switchMap`.

## Quick Reference: Common Refactoring Patterns

| Anti-pattern                                | Refactoring                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `a$.subscribe(x => b$.subscribe(y => ...))` | `a$.pipe(switchMap(x => b$))` (or `mergeMap`/`concatMap`/`exhaustMap`) |
| Mutable variable updated in subscribe       | `scan()` or `combineLatest` to derive state                            |
| `setTimeout` inside subscribe               | `delay()`, `timer()`, or `debounceTime()`                              |
| `if` guard in subscribe to skip values      | `filter()` before subscribe                                            |
| `try/catch` inside subscribe                | `catchError()` in the pipe                                             |
| Manual request cancellation flags           | `switchMap` (auto-cancels previous)                                    |
| Multiple subscribes to same cold observable | `shareReplay({ bufferSize: 1, refCount: true })`                       |
| `.subscribe()` just to trigger side effects | `tap()` for side effects, keep the chain going                         |
| Massive `new Observable()` constructor      | Small focused constructors + `defer()` + operator composition          |
| `await firstValueFrom()` inside subscribe   | `switchMap` — stay in the chain                                        |
