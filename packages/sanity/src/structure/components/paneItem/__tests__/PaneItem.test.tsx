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

async function renderPaneItem(props: Parameters<typeof PaneItem>[0]) {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(
    <PaneRouterContext.Provider value={mockPaneRouterContextValue}>
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
