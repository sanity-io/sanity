# Loading State Patterns

## Deriving loading state in the chain

Instead of tracking loading/error in mutable variables, derive it inside the `switchMap` using `startWith`:

```typescript
const dataWithLoadingState$ = input$.pipe(
  switchMap((value) =>
    fetchData(value).pipe(
      map((data) => ({loading: false, data})),
      catchError((error) => of({loading: false, error})),
      startWith({loading: true}),
    ),
  ),
)
```

## Extract into a reusable custom operator

```typescript
import {OperatorFunction, Observable, of} from 'rxjs'
import {switchMap, map, catchError, startWith} from 'rxjs/operators'

type LoadingState<T> =
  | {loading: true}
  | {loading: false; data: T}
  | {loading: false; error: unknown}

function withLoadingState<T, R>(
  project: (value: T) => Observable<R>,
): OperatorFunction<T, LoadingState<R>> {
  return (source) =>
    source.pipe(
      switchMap((value) =>
        project(value).pipe(
          map((data) => ({loading: false, data}) as const),
          catchError((error) => of({loading: false, error} as const)),
          startWith({loading: true} as const),
        ),
      ),
    )
}

// Now any stream can use it:
const results$ = searchInput$.pipe(withLoadingState((query) => apiService.search(query)))
```

Once a pattern is in an operator, it's tested once and reusable everywhere. The loading/error/data lifecycle
is guaranteed consistent across every stream that uses it.

## Preserving previous results across loading states

When a new input arrives, `switchMap` cancels the previous inner observable and starts fresh with
`{ loading: true }`. This means the UI loses the previous results during the loading phase — the user sees
a blank or spinner instead of the stale-but-still-useful data they were just looking at.

Use `scan` to carry forward previous results while new ones are loading:

```typescript
const results$ = searchInput$.pipe(
  withLoadingState((query) => apiService.search(query)),
  scan((previous, current) => {
    if (current.loading) {
      // Keep showing previous data while loading
      return {...current, data: 'data' in previous ? previous.data : undefined}
    }
    if ('error' in current) {
      // On error, keep the previous data so the UI doesn't blank out,
      // but surface the error so it can be displayed
      return {...current, data: 'data' in previous ? previous.data : undefined}
    }
    return current
  }),
)
```

Now the UI can:

- Show a loading indicator _and_ keep displaying previous results until new ones arrive
- On error, show the error message while still displaying the last successful results
- On success, replace everything with the fresh data

This avoids the jarring pattern where a transient network error wipes out perfectly good data the user was
just looking at.

The same `scan` pattern works for any situation where you want to "remember" something across emissions —
accumulating a list, tracking a running total, or preserving context that would otherwise be lost when the
stream moves to its next state.
