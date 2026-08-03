import {render, waitFor} from '@testing-library/react'
import {useDeferredValue} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {BehaviorSubject, type Observable} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {useDeferredObservableValue} from '../useDeferredObservableValue'

/**
 * These tests document the central claim debated in the review of the
 * "defer non-controlled useObservable subscriptions" PR:
 *
 * > Is it safe to defer a document-keyed observable read?
 *
 * Two sides were argued, and both are captured here as executable tests:
 *
 *  - The risk (raised by Bugbot / initial caution): a *bare*
 *    `useDeferredValue(useSyncObservable(x))` renders the *previous* observable's
 *    value on the render right after the observable identity changes in place
 *    (no remount). For a document-keyed read that means briefly showing the
 *    previous document's data under the new id — a tear.
 *
 *  - The resolution (Pedro): navigating to another document remounts the
 *    consumer because `<DocumentPaneProvider>`'s `key` changes, so per-document
 *    state resets and a deferred value can never leak across documents. See
 *    the "remount" test below.
 *
 * `useDeferredObservableValue` makes deferral safe in *both* situations: it
 * defers identity and value together and falls back to the live value when the
 * observable identity changes, so it never tears even without a remount.
 */

// Bare pattern the helper replaces — used only to document the tear it prevents.
function useBareDeferredObservableValue<T>(observable: Observable<T>, initialValue: T): T {
  return useDeferredValue(useSyncObservable(observable, initialValue))
}

describe('useDeferredObservableValue', () => {
  it('emits the observable values', async () => {
    const subject = new BehaviorSubject('first')
    const renderTimeline: (string | undefined)[] = []

    function TestComponent() {
      renderTimeline.push(useDeferredObservableValue(subject))
      return null
    }
    render(<TestComponent />)

    expect(renderTimeline[0]).toBe('first')

    subject.next('second')
    await waitFor(() => expect(renderTimeline[renderTimeline.length - 1]).toBe('second'))
  })

  it('falls back to the live value when the observable identity changes in place', async () => {
    const subjectA = new BehaviorSubject('value for a')
    const subjectB = new BehaviorSubject('initial for b')
    const renderTimeline: string[] = []

    function TestComponent({observable}: {observable: BehaviorSubject<string>}) {
      renderTimeline.push(useDeferredObservableValue(observable, 'fallback'))
      return null
    }
    const {rerender} = render(<TestComponent observable={subjectA} />)
    await waitFor(() => expect(renderTimeline[renderTimeline.length - 1]).toBe('value for a'))

    const timelineLengthBeforeSwitch = renderTimeline.length
    rerender(<TestComponent observable={subjectB} />)

    // The render right after the identity change must reflect the new
    // observable (BehaviorSubject emits synchronously), never the deferred
    // snapshot belonging to the previous observable.
    expect(renderTimeline[timelineLengthBeforeSwitch]).toBe('initial for b')
    expect(renderTimeline.slice(timelineLengthBeforeSwitch)).not.toContain('value for a')

    subjectB.next('updated for b')
    await waitFor(() => expect(renderTimeline[renderTimeline.length - 1]).toBe('updated for b'))
  })

  it('documents the tear a bare useDeferredValue(useSyncObservable(...)) produces on an in-place identity change', async () => {
    // This is the failure mode the helper exists to prevent. It is asserted
    // here so the risk is captured and cannot silently regress: a bare
    // deferral renders the PREVIOUS observable's value on the first render
    // after the identity switches without a remount.
    const subjectA = new BehaviorSubject('value for a')
    const subjectB = new BehaviorSubject('initial for b')
    const renderTimeline: string[] = []

    function TestComponent({observable}: {observable: BehaviorSubject<string>}) {
      renderTimeline.push(useBareDeferredObservableValue(observable, 'fallback'))
      return null
    }
    const {rerender} = render(<TestComponent observable={subjectA} />)
    await waitFor(() => expect(renderTimeline[renderTimeline.length - 1]).toBe('value for a'))

    const timelineLengthBeforeSwitch = renderTimeline.length
    rerender(<TestComponent observable={subjectB} />)

    // The tear: the previous observable's value leaks under the new identity.
    expect(renderTimeline[timelineLengthBeforeSwitch]).toBe('value for a')
    // It does eventually converge to the new value.
    await waitFor(() => expect(renderTimeline[renderTimeline.length - 1]).toBe('initial for b'))
  })

  it('remount on key change resets state, so even a bare deferral cannot leak across documents', async () => {
    // Documents Pedro's justification: `<DocumentPaneProvider>` changes its
    // `key` when the document changes, so the subtree remounts and per-document
    // state resets. A fresh mount subscribes to the new observable and shows
    // its value immediately — no stale value from the previous document, even
    // with the bare pattern.
    const subjectA = new BehaviorSubject('value for a')
    const subjectB = new BehaviorSubject('initial for b')
    const renderTimeline: string[] = []

    function Consumer({observable}: {observable: BehaviorSubject<string>}) {
      renderTimeline.push(useBareDeferredObservableValue(observable, 'fallback'))
      return null
    }
    // `docKey` mirrors the DocumentPaneProvider key: it changes with the doc.
    function Harness({docKey, observable}: {docKey: string; observable: BehaviorSubject<string>}) {
      return <Consumer key={docKey} observable={observable} />
    }

    const {rerender} = render(<Harness docKey="a" observable={subjectA} />)
    await waitFor(() => expect(renderTimeline[renderTimeline.length - 1]).toBe('value for a'))

    const timelineLengthBeforeSwitch = renderTimeline.length
    rerender(<Harness docKey="b" observable={subjectB} />)

    // Fresh mount for document "b": the new document's value renders
    // immediately and the previous document's value never appears afterwards.
    expect(renderTimeline[timelineLengthBeforeSwitch]).toBe('initial for b')
    expect(renderTimeline.slice(timelineLengthBeforeSwitch)).not.toContain('value for a')
  })
})
