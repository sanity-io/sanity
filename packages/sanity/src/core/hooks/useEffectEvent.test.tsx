import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// oxlint-disable-next-line eslint/no-restricted-imports -- intentional: regression coverage for facebook/react#34818 needs real forwardRef fibers and React's natively broken useEffectEvent
import {forwardRef, memo, useEffect, useEffectEvent as nativeUseEffectEvent, version} from 'react'
import {gte} from 'semver'
import {useEffectEvent} from 'use-effect-event'
import useEffectEventPkg from 'use-effect-event/package.json'
import {describe, expect, test, vi} from 'vitest'

/**
 * Require `use-effect-event@2.0.4` or newer. These tests fail on a downgrade into the
 * 2.0.0-2.0.3 range, and on React upgrades that invalidate the assumptions behind the ponyfill:
 *
 * - 2.0.4 wraps the event function in a stable `useState` initializer, so it keeps the same
 *   identity across renders and is safe to list in `useEffect` dependency arrays. That matters
 *   because React Compiler and oxlint's `react/exhaustive-effect-dependencies` insert the event
 *   function into the dependency arrays they generate (they only exempt the native hook).
 *   `use-effect-event@2.0.0` through `2.0.3` return a new function on every render, so every
 *   compiler-generated dependency array that contains one re-fires its effect on each render.
 * - The ponyfill must not be replaced with React's native `useEffectEvent` either: on React 19.2
 *   the native hook never sees values past the first render when the calling component is
 *   wrapped in `forwardRef` or `memo` (https://github.com/facebook/react/issues/34818, fixed in
 *   19.3 canaries). The canary test below fails once the installed React fixes that bug, which
 *   is the signal to re-evaluate the oxlint ban and this file.
 *
 * Studio code must not use `forwardRef` (see oxlint ban); this file is the sole exception so we
 * keep covering that fiber.
 */
describe('useEffectEvent', () => {
  test('calls the latest callback from forwardRef and memo components', () => {
    const listeners = new Set<() => void>()

    function useListener(callback: () => void) {
      const onEvent = useEffectEvent(callback)

      useEffect(() => {
        listeners.add(onEvent)
        return () => {
          listeners.delete(onEvent)
        }
        // oxlint-disable-next-line react/exhaustive-effect-dependencies -- effect events must not be listed in dependency arrays (react-hooks/exhaustive-deps enforces that), but this rule does not recognize the ponyfill as an effect event
      }, [])
    }

    const ForwardRefComp = forwardRef<HTMLDivElement, {onEvent: () => void}>(
      function ForwardRefComp({onEvent}, ref) {
        useListener(onEvent)
        return <div ref={ref} />
      },
    )

    const MemoComp = memo(function MemoComp({onEvent}: {onEvent: () => void}) {
      useListener(onEvent)
      return null
    })

    const staleForwardRef = vi.fn()
    const staleMemo = vi.fn()

    const {rerender} = render(
      <>
        <ForwardRefComp onEvent={staleForwardRef} />
        <MemoComp onEvent={staleMemo} />
      </>,
    )

    const latestForwardRef = vi.fn()
    const latestMemo = vi.fn()

    rerender(
      <>
        <ForwardRefComp onEvent={latestForwardRef} />
        <MemoComp onEvent={latestMemo} />
      </>,
    )

    for (const listener of listeners) listener()

    expect(latestForwardRef).toHaveBeenCalledTimes(1)
    expect(latestMemo).toHaveBeenCalledTimes(1)
    expect(staleForwardRef).not.toHaveBeenCalled()
    expect(staleMemo).not.toHaveBeenCalled()
  })

  test('returns a stable function that is safe in dependency arrays', () => {
    // Dependency arrays compare entries with Object.is, so collecting the event function from
    // every render into a Set measures exactly what a dependency array containing it would see:
    // one entry means effects keyed on the event never re-fire, one entry per render means they
    // re-fire on every render. React Compiler inserts the event function into the dependency
    // arrays it generates (it cannot recognize the ponyfill as an effect event), which is why
    // use-effect-event@2.0.0-2.0.3, which return a new identity on every render, are not usable.
    const identities = new Set<() => number>()

    function Counter({value}: {value: number}) {
      const getValue = useEffectEvent(() => value)

      useEffect(() => {
        identities.add(getValue)
      })

      return null
    }

    const {rerender} = render(<Counter value={1} />)
    rerender(<Counter value={2} />)
    rerender(<Counter value={3} />)

    expect(identities.size, 'the event function must keep the same identity across renders').toBe(1)

    const [getValue] = identities
    expect(getValue!(), 'the stable event function must still read the latest render values').toBe(
      3,
    )
  })

  test('canary: the native useEffectEvent still goes stale in forwardRef and memo components', async () => {
    // Event handlers are the canonical place to call effect events, and probing through them
    // needs no dependency arrays. The bug lives in how React commits the updated event
    // implementation for forwardRef and memo fibers, so it manifests identically for any caller.
    const results: Record<string, number> = {}
    const user = userEvent.setup()

    function PlainNative({value}: {value: number}) {
      const getValue = nativeUseEffectEvent(() => value)
      return <button data-testid="plain-native" onClick={() => (results.plain = getValue())} />
    }

    const ForwardRefNative = forwardRef<HTMLButtonElement, {value: number}>(
      function ForwardRefNative({value}, ref) {
        const getValue = nativeUseEffectEvent(() => value)
        return (
          <button
            data-testid="forwardref-native"
            onClick={() => (results.forwardRef = getValue())}
            ref={ref}
          />
        )
      },
    )

    const MemoNative = memo(function MemoNative({value}: {value: number}) {
      const getValue = nativeUseEffectEvent(() => value)
      return <button data-testid="memo-native" onClick={() => (results.memo = getValue())} />
    })

    const {rerender} = render(
      <>
        <PlainNative value={1} />
        <ForwardRefNative value={1} />
        <MemoNative value={1} />
      </>,
    )

    rerender(
      <>
        <PlainNative value={2} />
        <ForwardRefNative value={2} />
        <MemoNative value={2} />
      </>,
    )

    await user.click(screen.getByTestId('plain-native'))
    await user.click(screen.getByTestId('forwardref-native'))
    await user.click(screen.getByTestId('memo-native'))

    // Control group: in a plain function component the native hook sees the latest values, which
    // proves the harness itself is sound.
    expect(results.plain).toBe(2)

    // facebook/react#34818: forwardRef and memo fibers stay stuck on first-render values. When
    // these assertions start failing, React fixed the bug. Re-evaluate the oxlint ban on
    // importing useEffectEvent from react, and this file.
    expect(
      results.forwardRef,
      'native useEffectEvent is no longer stale under forwardRef: facebook/react#34818 appears fixed in this React version',
    ).toBe(1)
    expect(
      results.memo,
      'native useEffectEvent is no longer stale under memo: facebook/react#34818 appears fixed in this React version',
    ).toBe(1)
  })

  test('runs against a React 19.2.x release, where facebook/react#34818 is unfixed', () => {
    expect(
      version,
      'React is no longer 19.2.x. Check whether the native useEffectEvent still goes stale in forwardRef/memo components (facebook/react#34818) and re-evaluate the oxlint ban on importing useEffectEvent from react, and this file.',
    ).toMatch(/^19\.2\./)
  })

  test('resolves use-effect-event 2.0.4 or newer', () => {
    expect(
      gte(useEffectEventPkg.version, '2.0.4'),
      'use-effect-event@2.0.0-2.0.3 return a new function identity on every render, which re-fires every effect that lists the event in its dependency array, including the dependency arrays React Compiler generates. 2.0.4 restored a stable identity via useState. See the other tests in this file before changing the floor.',
    ).toBe(true)
  })
})
