import {act, render, screen} from '@testing-library/react'
import {ReplaySubject} from 'rxjs'
import {defineType} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {CrossDatasetIncomingReferenceType} from '../CrossDatasetIncomingReference/CrossDatasetIncomingReferenceType'
import {
  type CrossDatasetIncomingReferenceDocument,
  getCrossDatasetIncomingReferences,
} from '../CrossDatasetIncomingReference/getCrossDatasetIncomingReferences'
import {type CrossDatasetIncomingReference} from '../types'

vi.mock('../CrossDatasetIncomingReference/getCrossDatasetIncomingReferences', () => ({
  getCrossDatasetIncomingReferences: vi.fn(),
}))

const mockGetReferences = vi.mocked(getCrossDatasetIncomingReferences)

/** Built per call, like the schema's `renderMembers` builds a new decoration on every render */
function bookType(): CrossDatasetIncomingReference {
  return {type: 'book', dataset: 'test-us', preview: {select: {title: 'title'}}}
}

describe('CrossDatasetIncomingReferenceType', () => {
  it('keeps its references when the form re-renders with an equal but new type object', async () => {
    // Replays so the emission reaches the subscription `useObservablePromise` makes on commit,
    // whenever that commit lands
    const references$ = new ReplaySubject<CrossDatasetIncomingReferenceDocument[]>(1)
    mockGetReferences.mockReturnValue(references$)
    const wrapper = await createTestProvider({
      config: {
        projectId: 'test',
        dataset: 'test',
        schema: {
          types: [
            defineType({name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]}),
          ],
        },
      },
      resources: [structureUsEnglishLocaleBundle],
    })
    const referenced = {id: 'author-id', type: 'author'}
    let rerender!: ReturnType<typeof render>['rerender']
    // The list suspends on the references promise, and React refuses to resume work that
    // suspended inside `render`'s internal unawaited sync `act`, so mount inside an awaited one
    await act(async () => {
      rerender = render(
        <CrossDatasetIncomingReferenceType
          type={bookType()}
          referenced={referenced}
          shouldRenderTitle={false}
        />,
        {wrapper},
      ).rerender
    })
    expect(await screen.findByText('Loading cross dataset documents...')).toBeInTheDocument()
    await act(async () => {
      references$.next([])
    })
    expect(await screen.findByText('No items')).toBeInTheDocument()

    const fetchesBeforeRerender = mockGetReferences.mock.calls.length
    rerender(
      <CrossDatasetIncomingReferenceType
        type={bookType()}
        referenced={referenced}
        shouldRenderTitle={false}
      />,
    )

    // The same observable is reused: no new fetch, and no loading fallback in between
    expect(mockGetReferences).toHaveBeenCalledTimes(fetchesBeforeRerender)
    expect(screen.queryByText('Loading cross dataset documents...')).not.toBeInTheDocument()
    expect(screen.getByText('No items')).toBeInTheDocument()
  })
})
