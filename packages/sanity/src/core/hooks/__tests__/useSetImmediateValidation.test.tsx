import {type ValidationScheduling} from '@sanity/validation/_internal'
import {act, render} from '@testing-library/react'
import {config, defer, ReplaySubject} from 'rxjs'
import {finalize} from 'rxjs/operators'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ValidationStatus} from '../../validation'
import {useSetImmediateValidation} from '../useSetImmediateValidation'
import {useValidationStatus} from '../useValidationStatus'

// the store replays the latest status to every new subscriber
let validationSubject: ReplaySubject<ValidationStatus>
const immediateHolds = new Map<string, number>()
const holds = (validationTargetId: string) => immediateHolds.get(validationTargetId) ?? 0

// Referentially stable, like the real store: the hooks memoize on `documentStore.pair`.
const mockDocumentStore = {
  pair: {
    validation: (
      validationTargetId: string,
      _type: string,
      _validatePublishedReferences: boolean,
      options?: {scheduling?: ValidationScheduling},
    ) => {
      if (options?.scheduling !== 'immediate') return validationSubject.asObservable()
      return defer(() => {
        immediateHolds.set(validationTargetId, holds(validationTargetId) + 1)
        return validationSubject.pipe(
          finalize(() => {
            immediateHolds.set(validationTargetId, holds(validationTargetId) - 1)
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
  frames.push(useValidationStatus(id, 'author', false))
  useSetImmediateValidation(id, 'author', false, {enabled})
  return null
}

function Hold({enabled}: {enabled: boolean}) {
  useSetImmediateValidation('doc-1', 'author', false, {enabled})
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

  it('leaves the status read beside it untouched when it is enabled', () => {
    const {rerender} = render(<Probe id="doc-1" enabled={false} />)
    act(() => {
      validationSubject.next({validation: [], isValidating: true, revision: 'rev-1'})
    })
    const framesBeforeEnabling = frames.length

    rerender(<Probe id="doc-1" enabled />)

    // A frame of the initial status here would tell a publish gate that validation is done.
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
