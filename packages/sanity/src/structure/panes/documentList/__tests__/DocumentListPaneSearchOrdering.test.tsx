import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type PaneMenuItem} from '../../types'
import {
  DocumentListPaneSearchOrdering,
  getSearchOrderingId,
  RELEVANCE_ORDERING_ID,
} from '../DocumentListPaneSearchOrdering'

const ORDERINGS: PaneMenuItem[] = [
  {
    id: 'updated-desc',
    title: 'Last edited',
    action: 'setSortOrder',
    params: {by: [{field: '_updatedAt', direction: 'desc'}]},
  },
  {
    id: 'title-asc',
    title: 'Title',
    action: 'setSortOrder',
    params: {by: [{field: 'title', direction: 'asc'}]},
  },
]

async function renderControl(props: {
  value?: string
  onChange?: (id: string) => void
  orderings?: PaneMenuItem[]
}) {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  render(
    <DocumentListPaneSearchOrdering
      orderings={props.orderings ?? ORDERINGS}
      value={props.value ?? RELEVANCE_ORDERING_ID}
      onChange={props.onChange ?? vi.fn()}
    />,
    {wrapper},
  )
}

describe('DocumentListPaneSearchOrdering', () => {
  it('summarises relevance ranking by default', async () => {
    await renderControl({})
    expect(await screen.findByTestId('document-list-search-ordering')).toHaveTextContent(
      'Sorted by relevance',
    )
  })

  it('summarises the chosen configured ordering when one is active', async () => {
    await renderControl({value: getSearchOrderingId(ORDERINGS[0])})
    expect(await screen.findByTestId('document-list-search-ordering')).toHaveTextContent(
      'Sorted by Last edited',
    )
  })

  it('lets the editor switch to a configured ordering', async () => {
    const onChange = vi.fn()
    await renderControl({onChange})

    await userEvent.click(await screen.findByTestId('document-list-search-ordering'))
    await userEvent.click(await screen.findByText('Title'))

    expect(onChange).toHaveBeenCalledWith(getSearchOrderingId(ORDERINGS[1]))
  })

  it('lets the editor switch back to relevance', async () => {
    const onChange = vi.fn()
    await renderControl({value: getSearchOrderingId(ORDERINGS[0]), onChange})

    await userEvent.click(await screen.findByTestId('document-list-search-ordering'))
    await userEvent.click(await screen.findByText('Relevance'))

    expect(onChange).toHaveBeenCalledWith(RELEVANCE_ORDERING_ID)
  })

  it('falls back to a plain label when the list has no configured orderings', async () => {
    await renderControl({orderings: []})
    const label = await screen.findByTestId('document-list-search-ordering')
    expect(label).toHaveTextContent('Sorted by relevance')
    // Plain text, not a button.
    expect(label.tagName).not.toBe('BUTTON')
  })
})
