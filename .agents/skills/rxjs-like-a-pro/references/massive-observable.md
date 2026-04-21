# The Massive `new Observable()` Antipattern

A common antipattern is stuffing an entire program into a single `new Observable(subscriber => { ... })`
constructor. These tend to grow into massive imperative blocks — setting up event listeners, resolving
promises, subscribing to other observables, managing state — all inside one giant callback:

```typescript
// ❌ Bad: an entire application crammed into a single Observable constructor
const data$ = new Observable((subscriber) => {
  let retryCount = 0
  const controller = new AbortController()

  async function doFetch() {
    try {
      const response = await fetch('/api/data', {signal: controller.signal})
      const json = await response.json()
      subscriber.next(json)

      // Now set up an EventSource for live updates...
      const es = new EventSource('/api/updates')
      es.onmessage = (event) => {
        const update = JSON.parse(event.data)
        subscriber.next(update)
      }
      es.onerror = () => {
        es.close()
        if (retryCount < 3) {
          retryCount++
          setTimeout(doFetch, 1000)
        } else {
          subscriber.error(new Error('EventSource failed'))
        }
      }
      subscriber.add(() => es.close())
    } catch (err) {
      subscriber.error(err)
    }
  }
  doFetch()

  return () => controller.abort()
})
```

This is imperative code wearing an Observable costume. It manually tracks retry count, manages cleanup,
handles errors with try/catch — all things RxJS has operators for.

## The fix: small constructors + operator composition

The `new Observable()` constructor should be small and focused — the bridge from a _single_ non-reactive
source into the reactive world:

```typescript
// ✅ Good: small focused observables composed together
// Step 1: small Observable constructor — bridges EventSource and nothing else
function fromEventSource(url: string) {
  return new Observable<MessageEvent>((subscriber) => {
    const es = new EventSource(url)
    es.onmessage = (event) => subscriber.next(event)
    es.onerror = () => subscriber.error(new Error('EventSource connection failed'))
    return () => es.close()
  })
}

// Step 2: compose everything with operators
const updates$ = fromEventSource('/api/updates').pipe(
  retry({count: 3, delay: (_, attempt) => timer(attempt * 1000)}),
  map((event) => JSON.parse(event.data)),
)

const initialSnapshot$ = new Observable<Response>((subscriber) => {
  const controller = new AbortController()
  fetch('/api/data', {signal: controller.signal}).then(
    (response) => {
      subscriber.next(response)
      subscriber.complete()
    },
    (err) => subscriber.error(err),
  )
  return () => controller.abort()
}).pipe(mergeMap((response) => response.json()))

const data$ = merge(initialSnapshot$, updates$)
```

Notice how `defer(() => somePromise)` often replaces `new Observable` entirely for promise-based sources.
`defer` is lazy — it won't call the function until someone subscribes, and each subscriber gets a fresh
execution. The JSON parsing moves to a `map` in the chain — keeping the `fromEventSource` bridge generic
and reusable.

## Rules of thumb

- `new Observable()` should be a few lines that bridge _one_ non-reactive source (a DOM event, an
  EventSource, a callback-based API) — the thinnest possible adapter
- `defer(() => promise)` replaces `new Observable` for anything promise/async-based
- Retry logic, error handling, combining sources, timing — all of that belongs in the operator chain, not
  inside the constructor
- If your `new Observable` callback is longer than ~10 lines, it's probably doing too much
