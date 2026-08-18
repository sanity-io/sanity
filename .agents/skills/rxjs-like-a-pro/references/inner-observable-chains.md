# Composing Inner Observable Chains

One of the most powerful — and underused — patterns in RxJS is building rich inner observable chains inside
flattening operators. People often think of `switchMap` as "map a value to a single request", but the inner
observable can be an entire sequence of events with its own timing, ordering, and lifecycle.

## Delayed actions with inner observables

Instead of using `setTimeout` in a subscribe callback, compose timing directly:

```typescript
// ❌ Bad: imperative timeout inside subscribe
click$.subscribe(() => {
  showTooltip()
  setTimeout(() => hideTooltip(), 3000)
})

// ✅ Good: timing is part of the chain
click$
  .pipe(switchMap(() => concat(of('show'), timer(3000).pipe(map(() => 'hide')))))
  .subscribe((action) => {
    action === 'show' ? showTooltip() : hideTooltip()
  })
```

The reactive version gets cancellation for free — if the user clicks again, `switchMap` tears down the
previous timer and starts fresh. The imperative version would need manual `clearTimeout` tracking.

## Animation sequences

Inner observable chains are perfect for multi-phase sequences. Each phase is an observable, and `concat`
plays them in order:

```typescript
// A notification that fades in, stays visible, then fades out
function showNotification(message: string) {
  return concat(
    // Phase 1: fade in over 300ms
    animateOpacity(0, 1, 300).pipe(map((opacity) => ({message, opacity, visible: true}))),
    // Phase 2: stay visible for 3 seconds
    timer(3000).pipe(map(() => ({message, opacity: 1, visible: true}))),
    // Phase 3: fade out over 300ms
    animateOpacity(1, 0, 300).pipe(map((opacity) => ({message, opacity, visible: opacity > 0}))),
  )
}

// Using it — each new notification cancels the previous one mid-animation
notification$
  .pipe(switchMap((message) => showNotification(message)))
  .subscribe((state) => render(state))
```

The key insight: the inner observable returned by a flattening operator doesn't have to be a single HTTP
request — it can be an entire timeline of events. `concat`, `merge`, `timer`, `interval`, `delay` — these
are all tools for composing rich inner sequences. And the outer flattening operator (`switchMap`,
`concatMap`, etc.) handles the lifecycle of the whole sequence as a unit.
