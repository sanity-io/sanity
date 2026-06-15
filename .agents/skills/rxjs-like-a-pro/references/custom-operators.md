# Custom Operators

Custom operators are just functions that take an observable and return an observable. They're how you make
reusable, composable pieces of stream logic — and they're simpler than they look.

## Inline custom operators

The simplest form is a function you write right in the pipe. Any time you find yourself doing the same
multi-step `.pipe()` chain in several places, that's a candidate:

```typescript
// An inline operator is just a function: Observable<In> → Observable<Out>
const results$ = searchInput$.pipe(
  // inline operator — debounce, deduplicate, and skip empty
  (source) =>
    source.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((query) => query.length > 0),
    ),
  switchMap((query) => apiService.search(query)),
)
```

This works because `.pipe()` accepts any function with the signature `(source: Observable<A>) => Observable<B>`.

## Extracting into a reusable operator

When you use the same inline operator in multiple places, extract it into a named function. Use
`OperatorFunction<In, Out>` as the return type so it slots cleanly into any `.pipe()` chain:

```typescript
import {OperatorFunction, Observable} from 'rxjs'
import {debounceTime, distinctUntilChanged, filter} from 'rxjs/operators'

interface StabilizeOptions {
  debounce?: number
  minLength?: number
}

function stabilizeInput(options: StabilizeOptions = {}): OperatorFunction<string, string> {
  const {debounce = 300, minLength = 1} = options
  return (source: Observable<string>) =>
    source.pipe(
      debounceTime(debounce),
      distinctUntilChanged(),
      filter((query) => query.length >= minLength),
    )
}

// Now reusable across any text input stream:
const search$ = searchInput$.pipe(
  stabilizeInput({debounce: 200}),
  switchMap((query) => apiService.search(query)),
)

const autocomplete$ = nameInput$.pipe(
  stabilizeInput({debounce: 500, minLength: 2}),
  switchMap((name) => apiService.suggest(name)),
)
```

The pattern is always the same:

1. Write a function that accepts configuration (if any) and returns `OperatorFunction<In, Out>`
2. The returned function takes a `source` observable and pipes operators onto it
3. Use it in `.pipe()` just like any built-in operator

Custom operators are a sign of mature RxJS code. They encapsulate domain-specific stream logic (debounce
policies, retry strategies, polling intervals, auth token refresh) into tested, named, reusable pieces. When
you see repeated `.pipe()` chains or complex inline logic, extract an operator.
