import {type SanityDocument, type ValidationMarker} from '@sanity/types'
import {act, renderHook} from '@testing-library/react'
import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {validateDocumentImmediately} from '../../validation'
import {useImmediateValidation} from '../useImmediateValidation'

const source = {
  getClient: vi.fn(),
  schema: {name: 'test'},
  i18n: {},
  currentUser: {id: 'user-1'},
}
const observeDocumentPairAvailability = vi.fn()

vi.mock('../../studio/source', () => ({useSource: () => source}))
vi.mock('../../store/datastores', () => ({
  useDocumentPreviewStore: () => ({
    unstable_observeDocumentPairAvailability: observeDocumentPairAvailability,
  }),
}))
vi.mock('../../validation', async (importOriginal) => ({
  ...(await importOriginal()),
  validateDocumentImmediately: vi.fn(),
}))

const mockValidateDocumentImmediately = validateDocumentImmediately as Mock<
  typeof validateDocumentImmediately
>

const DRAFT: SanityDocument = {
  _id: 'drafts.author-1',
  _type: 'author',
  _rev: 'rev-1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  name: 'Ada',
}
const REQUIRED_BIO: ValidationMarker = {level: 'error', message: 'Required', path: ['bio']}

interface Props {
  document: SanityDocument | null
  enabled: boolean
}

function renderValidation(initialProps: Props) {
  return renderHook(
    ({document, enabled}: Props) => useImmediateValidation(document, true, enabled),
    {initialProps},
  )
}

let runs: Subject<ValidationMarker[]>[]

/**
 * Waits for the `count`th run to be under way. The observable is created on render, but it is
 * subscribed in a task of its own, so that the enabling render can paint first.
 */
function expectRuns(count: number) {
  return vi.waitFor(() => {
    expect(mockValidateDocumentImmediately).toHaveBeenCalledTimes(count)
    expect(runs[count - 1].observed).toBe(true)
  })
}

describe('useImmediateValidation', () => {
  beforeEach(() => {
    runs = []
    mockValidateDocumentImmediately.mockImplementation(() => {
      const run = new Subject<ValidationMarker[]>()
      runs.push(run)
      return run
    })
  })

  it('does nothing while not enabled', async () => {
    const {result} = renderValidation({document: DRAFT, enabled: false})

    expect(result.current).toBeNull()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(mockValidateDocumentImmediately).not.toHaveBeenCalled()
  })

  it('validates once enabled, reporting the run and then its markers', async () => {
    const {result, rerender} = renderValidation({document: DRAFT, enabled: false})

    rerender({document: DRAFT, enabled: true})
    expect(result.current).toEqual({isValidating: true, validation: [], revision: 'rev-1'})
    await expectRuns(1)
    expect(mockValidateDocumentImmediately).toHaveBeenCalledWith(
      {
        getClient: source.getClient,
        observeDocumentPairAvailability,
        schema: source.schema,
        i18n: source.i18n,
        currentUser: source.currentUser,
      },
      DRAFT,
      true,
    )

    act(() => {
      runs[0].next([REQUIRED_BIO])
      runs[0].complete()
    })
    expect(result.current).toEqual({
      isValidating: false,
      validation: [REQUIRED_BIO],
      revision: 'rev-1',
    })
  })

  it('keeps the run when a new revision has the same content, reporting that revision', async () => {
    const {result, rerender} = renderValidation({document: DRAFT, enabled: true})
    await expectRuns(1)

    rerender({
      document: {...DRAFT, _rev: 'rev-2', _updatedAt: '2024-01-01T00:00:01Z'},
      enabled: true,
    })

    expect(result.current).toEqual({isValidating: true, validation: [], revision: 'rev-2'})
    act(() => {
      runs[0].next([])
      runs[0].complete()
    })
    expect(result.current).toEqual({isValidating: false, validation: [], revision: 'rev-2'})
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(mockValidateDocumentImmediately).toHaveBeenCalledTimes(1)
  })

  it('starts over when the content changes', async () => {
    const {result, rerender} = renderValidation({document: DRAFT, enabled: true})
    await expectRuns(1)
    act(() => {
      runs[0].next([])
      runs[0].complete()
    })
    expect(result.current?.isValidating).toBe(false)

    const edited = {...DRAFT, _rev: 'rev-2', name: 'Ada Lovelace'}
    rerender({document: edited, enabled: true})

    expect(result.current).toEqual({isValidating: true, validation: [], revision: 'rev-2'})
    await expectRuns(2)
    expect(mockValidateDocumentImmediately).toHaveBeenLastCalledWith(
      expect.anything(),
      edited,
      true,
    )
  })

  it('stops the run once it is disabled', async () => {
    const {result, rerender} = renderValidation({document: DRAFT, enabled: true})
    await expectRuns(1)
    expect(runs[0].observed).toBe(true)

    rerender({document: DRAFT, enabled: false})

    expect(result.current).toBeNull()
    // react-rx lets go of a source a tick after its last subscriber left
    await vi.waitFor(() => expect(runs[0].observed).toBe(false))
    expect(mockValidateDocumentImmediately).toHaveBeenCalledTimes(1)
  })
})
