import {type SanityDocument} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {PaneItem} from '../PaneItem'

const mockPaneRouterContextValue: PaneRouterContextValue = {
  index: 0,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  ChildLink: ({children}) => <>{children}</>,
  ReferenceChildLink: ({children}) => <>{children}</>,
  handleEditReference: () => {},
  ParameterizedLink: () => null,
  replaceCurrent: () => {},
  closeCurrent: () => {},
  closeCurrentAndAfter: () => {},
  duplicateCurrent: () => {},
  setView: () => {},
  setParams: () => {},
  setPayload: () => {},
  createPathWithParams: () => '',
  navigateIntent: () => {},
}

async function renderPaneItem(
  props: Parameters<typeof PaneItem>[0],
  routerOverrides: Partial<PaneRouterContextValue> = {},
) {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(
    <PaneRouterContext.Provider value={{...mockPaneRouterContextValue, ...routerOverrides}}>
      <PaneItem {...props} />
    </PaneRouterContext.Provider>,
    {wrapper},
  )
}

describe('PaneItem count badge', () => {
  it('renders the locale-formatted count when count is a number', async () => {
    await renderPaneItem({id: 'species', title: 'Species', count: 32145})

    const badge = await screen.findByTestId('pane-item-count')
    expect(badge).toHaveTextContent('32,145')
  })

  it('renders a resolved count of 0 as 0', async () => {
    await renderPaneItem({id: 'species', title: 'Species', count: 0})

    const badge = await screen.findByTestId('pane-item-count')
    expect(badge).toHaveTextContent('0')
  })

  it('does not render a count badge when count is undefined', async () => {
    await renderPaneItem({id: 'species', title: 'Species'})

    expect(screen.queryByTestId('pane-item-count')).not.toBeInTheDocument()
  })
})

describe('PaneItem child parameters', () => {
  const book = {_id: 'book-1', _type: 'book'} as SanityDocument

  // Records the parameters the row asks its link to open the next pane with
  const RecordingChildLink: PaneRouterContextValue['ChildLink'] = ({childParameters, children}) => (
    <div data-testid="child-link" data-parameters={JSON.stringify(childParameters ?? null)}>
      {children}
    </div>
  )

  const withInventoryOpen: Partial<PaneRouterContextValue> = {
    ChildLink: RecordingChildLink,
    routerPanesState: [
      [{id: 'book'}],
      [{id: 'book-0', params: {inspect: 'sanity/structure/document-group'}}],
    ],
  }

  it('carries the open document group inventory to the next document', async () => {
    await renderPaneItem({id: 'book-1', title: 'Book 1', value: book}, withInventoryOpen)

    expect(await screen.findByTestId('child-link')).toHaveAttribute(
      'data-parameters',
      JSON.stringify({inspect: 'sanity/structure/document-group'}),
    )
  })

  it('carries nothing when the inventory is closed', async () => {
    await renderPaneItem(
      {id: 'book-1', title: 'Book 1', value: book},
      {
        ChildLink: RecordingChildLink,
        routerPanesState: [[{id: 'book'}], [{id: 'book-0'}]],
      },
    )

    expect(await screen.findByTestId('child-link')).toHaveAttribute('data-parameters', 'null')
  })

  it('does not carry another inspector', async () => {
    await renderPaneItem(
      {id: 'book-1', title: 'Book 1', value: book},
      {
        ChildLink: RecordingChildLink,
        routerPanesState: [
          [{id: 'book'}],
          [{id: 'book-0', params: {inspect: 'sanity/validation'}}],
        ],
      },
    )

    expect(await screen.findByTestId('child-link')).toHaveAttribute('data-parameters', 'null')
  })

  it('carries nothing for a row that is not a document', async () => {
    await renderPaneItem({id: 'species', title: 'Species'}, withInventoryOpen)

    expect(await screen.findByTestId('child-link')).toHaveAttribute('data-parameters', 'null')
  })
})
