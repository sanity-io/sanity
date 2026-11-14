import {type ValidationScheduling} from '@sanity/validation/_internal'
import {act, render} from '@testing-library/react'
import {config, defer, ReplaySubject} from 'rxjs'
import {finalize} from 'rxjs/operators'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ValidationListener} from '../../store/document/document-pair/validation'
import {type ValidationStatus} from '../../validation'
import {useSetImmediateValidation} from '../useSetImmediateValidation'
import {useValidationStatus} from '../useValidationStatus'

// the store replays the latest status to every new subscriber
let validationSubject: ReplaySubject<ValidationStatus>
const immediateHolds = new Map<string, number>()
const holds = (validationTargetId: string, listener: ValidationListener = 'document') =>
  immediateHolds.get(`${validationTargetId}:${listener}`) ?? 0

// Referentially stable, like the real store: the hooks memoize on `documentStore.pair`.
const mockDocumentStore = {
  pair: {
    validation: (
      validationTargetId: string,
      _type: string,
      _validatePublishedReferences: boolean,
      options?: {scheduling?: ValidationScheduling; listener?: ValidationListener},
    ) => {
      if (options?.scheduling !== 'immediate') return validationSubject.asObservable()
      const listener = options.listener ?? 'document'
      return defer(() => {
        immediateHolds.set(
          `${validationTargetId}:${listener}`,
          holds(validationTargetId, listener) + 1,
        )
        return validationSubject.pipe(
          finalize(() => {
            immediateHolds.set(
              `${validationTargetId}:${listener}`,
              holds(validationTargetId, listener) - 1,
            )
          }),
        )
      })
    },
  },
}

vi.mock('../../store/datastores', () => ({
  useDocumentStore: () => mockDocumentStore,
}))

let frames: ValidationStatus[] = []

function Probe({id, enabled}: {id: string; enabled: boolean}) {
  frames.push(useValidationStatus(id, 'author'))
  useSetImmediateValidation(id, 'author', false, {enabled})
  return null
}

function Hold({enabled, listener}: {enabled: boolean; listener?: ValidationListener}) {
  useSetImmediateValidation('doc-1', 'author', false, {enabled, listener})
  return null
}

describe('useSetImmediateValidation', () => {
  beforeEach(() => {
    validationSubject = new ReplaySubject<ValidationStatus>(1)
    immediateHolds.clear()
    frames = []
  })

  it('holds the document at immediate validation only while enabled', () => {
    const {rerender, unmount} = render(<Probe id="doc-1" enabled={false} />)
    expect(holds('doc-1')).toBe(0)

    rerender(<Probe id="doc-1" enabled />)
    expect(holds('doc-1')).toBe(1)

    rerender(<Probe id="doc-1" enabled={false} />)
    expect(holds('doc-1')).toBe(0)

    rerender(<Probe id="doc-1" enabled />)
    unmount()
    expect(holds('doc-1')).toBe(0)
  })

  it('moves the hold to the document it is given', () => {
    const {rerender, unmount} = render(<Probe id="doc-1" enabled />)

    rerender(<Probe id="doc-2" enabled />)
    expect([holds('doc-1'), holds('doc-2')]).toEqual([0, 1])

    unmount()
  })

  it('holds the validation of the listener it is given, the document pair by default', () => {
    const {rerender, unmount} = render(<Hold enabled />)
    expect([holds('doc-1', 'document'), holds('doc-1', 'global')]).toEqual([1, 0])

    rerender(<Hold enabled listener="global" />)
    expect([holds('doc-1', 'document'), holds('doc-1', 'global')]).toEqual([0, 1])

    unmount()
    expect([holds('doc-1', 'document'), holds('doc-1', 'global')]).toEqual([0, 0])
  })

  it('leaves the status read beside it untouched when it is enabled', () => {
    const {rerender} = render(<Probe id="doc-1" enabled={false} />)
    act(() => {
      validationSubject.next({validation: [], isValidating: true, revision: 'rev-1'})
    })
    const framesBeforeEnabling = frames.length

    rerender(<Probe id="doc-1" enabled />)

    // A finished frame here would tell a publish gate that validation is done before this read has
    // caught up.
    expect(frames.length).toBeGreaterThan(framesBeforeEnabling)
    expect(frames.slice(framesBeforeEnabling).filter((frame) => !frame.isValidating)).toEqual([])
  })

  it('leaves a failed validation to useValidationStatus to report, and ends its hold with it', async () => {
    const onUnhandledError = vi.fn()
    config.onUnhandledError = onUnhandledError
    try {
      render(<Hold enabled />)
      expect(holds('doc-1')).toBe(1)

      act(() => {
        validationSubject.error(new Error('listener failed'))
      })
      // RxJS reports an error that nothing handles from a timeout
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(onUnhandledError).not.toHaveBeenCalled()
      expect(holds('doc-1')).toBe(0)
    } finally {
      config.onUnhandledError = null
    }
  })
})
