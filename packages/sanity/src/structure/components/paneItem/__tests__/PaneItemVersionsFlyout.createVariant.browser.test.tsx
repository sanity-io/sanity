import {RouterProvider} from 'sanity/router'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
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

function renderRow(onNavigate: OnNavigate) {
  void render(
    <TestWrapper schemaTypes={[]}>
      <RouterProvider router={router} state={{panes: [[{id: 'book'}]]}} onNavigate={onNavigate}>
        <PaneRouterContext.Provider value={paneRouterContextValue}>
          <div style={{padding: 40}}>
            <a data-pane-item-row="" data-testid="row" href="#row" tabIndex={-1}>
              Riften
              <PaneItemVersionsFlyout childId="riften" renderList={renderList} />
            </a>
          </div>
        </PaneRouterContext.Provider>
      </RouterProvider>
    </TestWrapper>,
  )
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
    const onNavigate: OnNavigate = vi.fn()
    renderRow(onNavigate)
    await page.getByTestId('row').hover()
    await page.getByRole('menuitem', {name: 'German'}).click()

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
    const onNavigate: OnNavigate = vi.fn()
    renderRow(onNavigate)
    await page.getByTestId('row').hover()
    await page.getByRole('menuitem', {name: 'French'}).click()

    const {pane, variant} = lastPane(onNavigate)
    expect(pane?.params).toEqual({inspect: DOCUMENT_GROUP_INSPECTOR_NAME})
    expect(variant).toBe('variant:french')
  })
})
