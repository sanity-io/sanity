import {act} from '@testing-library/react'

/**
 * Flushes pending microtasks (resolved promises in useEffect hooks, etc).
 *
 * Needed when components use the fire-and-forget async antipattern:
 *   `useEffect(() => { void someAsyncFn().then(setState) }, [])`
 *
 * The promise resolves on the next microtask — after act() has closed — so the
 * setState fires outside the React batching boundary, producing act() warnings.
 * This helper drains the microtask queue inside act() to let those settle.
 *
 * Example: `useReleasePermissions().checkWithPermissionGuard()` returns a
 * promise whose `.then()` calls `setHasPermission()` — every component that
 * consumes it needs this flush in tests.
 *
 * If you're reaching for this in a new test, consider fixing the component
 * instead: the hook should expose resolved state synchronously (e.g. through
 * context or a synchronous return value) rather than requiring each consumer
 * to do async check-and-setState in an effect.
 *
 * @see https://react.dev/learn/you-might-not-need-an-effect
 */
export async function flushMicrotasksThisIsACodeSmell(): Promise<void> {
  await act(async () => {
    /* no-op */
  })
}
