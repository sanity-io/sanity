import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {RouterProvider} from 'sanity/router'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  CREATE_VARIANT_PARAM,
  DOCUMENT_GROUP_INSPECTOR_NAME,
} from '../../../panes/document/constants'
import {router} from '../../../router'
import {type RouterPanes} from '../../../types'
import {PaneItemVersionsFlyout, type PaneItemVersionsFlyoutActions} from '../PaneItemVersionsFlyout'

const GERMAN = '_.variants.german'
const FRENCH = '_.variants.french'

const paneRouterContextValue = {
  index: 1,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [[{id: 'book'}]],
} as unknown as PaneRouterContextValue

/**
 * The flyout's content as `PaneItemPreview` wires it: German has no version in the release in
 * view, so its pick asks for it to be created; French has one, so its pick adds nothing.
 */
function renderList({onPick}: PaneItemVersionsFlyoutActions) {
  return (
    <div role="menu" aria-label="Versions">
      <button
        role="menuitem"
        type="button"
        onClick={() => onPick(GERMAN, {[CREATE_VARIANT_PARAM]: GERMAN})}
      >
        German
      </button>
      <button role="menuitem" type="button" onClick={() => onPick(FRENCH)}>
        French
      </button>
    </div>
  )
}

type OnNavigate = Mock<(opts: {path: string; replace?: boolean}) => void>

/** Renders the row, opens its flyout from the keyboard and picks `name`. */
async function pick(name: string) {
  const onNavigate: OnNavigate = vi.fn()
  const wrapper = await createTestProvider()
  const user = userEvent.setup({delay: null})
  render(
    <RouterProvider router={router} state={{panes: [[{id: 'book'}]]}} onNavigate={onNavigate}>
      <PaneRouterContext.Provider value={paneRouterContextValue}>
        <a data-pane-item-row="" data-testid="row" href="#row" tabIndex={-1}>
          Riften
          <PaneItemVersionsFlyout childId="riften" renderList={renderList} />
        </a>
      </PaneRouterContext.Provider>
    </RouterProvider>,
    {wrapper},
  )
  screen.getByTestId('row').focus()
  await user.keyboard('{ArrowRight}')
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100))
  })
  await user.click(screen.getByRole('menuitem', {name, hidden: true}))
  return onNavigate
}

function lastPane(onNavigate: OnNavigate) {
  const [{path}] = onNavigate.mock.lastCall as [{path: string}]
  const panes = (router.decode(path) as {panes?: RouterPanes} | null)?.panes
  return {
    pane: panes?.[1]?.[0],
    variant: new URL(path, 'http://localhost').searchParams.get('variant'),
  }
}

describe('PaneItemVersionsFlyout: create variant', () => {
  it('opens a variant missing in the release with Manage versions asked to create it', async () => {
    const onNavigate = await pick('German')

    const {pane, variant} = lastPane(onNavigate)
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(pane).toMatchObject({
      id: 'riften',
      params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME, [CREATE_VARIANT_PARAM]: GERMAN},
    })
    // The pick still lands on the picked variant, not on Default
    expect(variant).toBe('variant:german')
  })

  it('opens a variant that has a version in the release without the param', async () => {
    const onNavigate = await pick('French')

    const {pane, variant} = lastPane(onNavigate)
    expect(pane?.params).toEqual({inspect: DOCUMENT_GROUP_INSPECTOR_NAME})
    expect(variant).toBe('variant:french')
  })
})
