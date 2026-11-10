import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {RouterProvider} from 'sanity/router'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, vi} from 'vitest'

import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../../panes/document/constants'
import {router} from '../../../router'
import {type RouterPanes} from '../../../types'
import {PaneItemVersionsLink} from '../PaneItemVersionsLink'

const paneRouterContextValue: PaneRouterContextValue = {
  index: 1,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [[{id: 'book'}]],
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

function renderInRowLink(onRowClick: () => void) {
  const onNavigate = vi.fn()

  render(
    <RouterProvider router={router} state={{panes: [[{id: 'book'}]]}} onNavigate={onNavigate}>
      <PaneRouterContext.Provider value={paneRouterContextValue}>
        <a href="#row" onClick={onRowClick}>
          <PaneItemVersionsLink childId="winterhold">
            <span>status icons</span>
          </PaneItemVersionsLink>
        </a>
      </PaneRouterContext.Provider>
    </RouterProvider>,
  )

  return {onNavigate}
}

describe('PaneItemVersionsLink', () => {
  it('opens the document with the document group inventory open', async () => {
    const onRowClick = vi.fn()
    const {onNavigate} = renderInRowLink(onRowClick)

    await userEvent.click(screen.getByTestId('pane-item-versions-link'))

    expect(onRowClick).not.toHaveBeenCalled()
    expect(onNavigate).toHaveBeenCalledTimes(1)
    const [{path}] = onNavigate.mock.calls[0]
    const panes = (router.decode(path) as {panes?: RouterPanes} | null)?.panes
    expect(panes).toHaveLength(2)
    expect(panes?.[0]?.[0]?.id).toBe('book')
    expect(panes?.[1]?.[0]).toMatchObject({
      id: 'winterhold',
      params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME},
    })
  })

  it('leaves modified clicks to the row link', async () => {
    const onRowClick = vi.fn()
    const {onNavigate} = renderInRowLink(onRowClick)

    const user = userEvent.setup()
    await user.keyboard('{Meta>}')
    await user.click(screen.getByTestId('pane-item-versions-link'))
    await user.keyboard('{/Meta}')

    expect(onNavigate).not.toHaveBeenCalled()
    expect(onRowClick).toHaveBeenCalledTimes(1)
  })
})
