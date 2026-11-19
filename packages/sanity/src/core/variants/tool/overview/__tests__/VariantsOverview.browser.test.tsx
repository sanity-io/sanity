import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {VariantsModePromiseContext} from 'sanity/_singletons'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ResourceCacheProvider, useResourceCache} from '../../../../store/ResourceCacheProvider'
import {useWorkspace} from '../../../../studio/workspace'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {type VariantsMode} from '../../../contexts/mode/types'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type VariantStore} from '../../../store/createVariantsStore'
import {type VariantStoreState} from '../../../store/reducer'
import {VariantsOverview} from '../VariantsOverview'

const LOADED_STATE: VariantStoreState = {
  variants: new Map([
    [variantAlphaAudience._id, variantAlphaAudience],
    [variantNorwegianMarket._id, variantNorwegianMarket],
  ]),
  state: 'loaded',
}

// The mock studio's client answers every query with `null`, so the real store would never leave
// its loading state. A settled store is seeded into the resource cache instead; the document
// counts still go through the real hook, which resolves them to 0 against the mock client.
const VARIANTS_STORE: VariantStore = {
  state$: of(LOADED_STATE),
  initialState: LOADED_STATE,
  dispatch: noop,
}

// The variants plugin's provider is not mounted here; a settled mode lets the overview read it
// with `use()` without suspending.
const DEFAULT_MODE = Object.assign(Promise.resolve<VariantsMode>('default'), {
  status: 'fulfilled' as const,
  value: 'default' as const,
})

function SeededVariantsStore(props: {children: ReactNode}) {
  const {children} = props
  const workspace = useWorkspace()
  const resourceCache = useResourceCache()
  // Seeded during the first render so `useVariantsStore` in the children finds the settled store
  // instead of creating the real one.
  useState(() => {
    resourceCache.set({
      namespace: 'VariantsStore',
      dependencies: [workspace],
      value: VARIANTS_STORE,
    })
    return null
  })
  return children
}

// Every row links to the detail page through the tool's `:variantId` segment, which the mock
// studio's router does not know about, so the harness mounts the tool's own routes.
const router = route.create('/', [route.intents('/intent'), route.create('/:variantId')])

function VariantsOverviewHarness() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <ResourceCacheProvider>
        <SeededVariantsStore>
          <RouterProvider router={router} state={{}} onNavigate={noop}>
            <VariantsModePromiseContext value={DEFAULT_MODE}>
              <VariantsOverview />
            </VariantsModePromiseContext>
          </RouterProvider>
        </SeededVariantsStore>
      </ResourceCacheProvider>
    </TestWrapper>
  )
}

const {settleChromaticEndState} = testHelpers()

async function expectRowsSettled(count: number) {
  const table = page.getByTestId('variant-definitions-table')
  await expect.element(table).toBeVisible()
  await expect.poll(() => table.getByTestId('table-row').elements().length).toBe(count)
  // Document counts render a skeleton until the counts query settles.
  await expect.poll(() => table.element().querySelectorAll('[data-ui="Skeleton"]').length).toBe(0)
}

const BANNER_DISMISSED_KEY = 'sanityStudio:variants:open-beta-feedback-banner:dismissed:v1'

// The open beta banner's dismissal is kept in local storage, so every test starts with it shown.
beforeEach(() => {
  window.localStorage.removeItem(BANNER_DISMISSED_KEY)
})

describe('VariantsOverview', () => {
  it('lists every variant definition with its conditions and document count', async () => {
    void render(<VariantsOverviewHarness />)

    await expectRowsSettled(2)
    await expect.element(page.getByText('Alpha audience')).toBeVisible()
    await expect.element(page.getByText('Norwegian market')).toBeVisible()

    await settleChromaticEndState()
    expect(
      page.getByTestId('variant-definitions-table').getByTestId('table-row').elements(),
    ).toHaveLength(2)
  })

  it('moves focus into the add filter popover and back to its trigger on Escape', async () => {
    void render(<VariantsOverviewHarness />)

    await expectRowsSettled(2)
    const trigger = page.getByRole('button', {name: 'Add filter'})
    await userEvent.click(trigger)

    const search = page.getByLabelText('Search dimensions…')
    await expect.element(search).toBeVisible()
    await expect.element(search).toHaveFocus()
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{Escape}')

    await expect.element(search).not.toBeVisible()
    await expect.element(trigger).toHaveFocus()
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')

    await settleChromaticEndState()
    await expect.element(trigger).toHaveFocus()
  })

  it('narrows the list from the search box in the command lane', async () => {
    void render(<VariantsOverviewHarness />)

    await expectRowsSettled(2)
    const search = page.getByPlaceholder('Search variant definitions…')
    await userEvent.fill(search, 'Norwegian')

    await expect.poll(() => page.getByTestId('table-row').elements().length).toBe(1)
    await expect.element(page.getByText('Norwegian market')).toBeVisible()

    await settleChromaticEndState()
    await expect.element(search).toHaveValue('Norwegian')
  })
})

describe('VariantsOverview open beta feedback', () => {
  it('shows the open beta banner, whose link opens the feedback dialog', async () => {
    void render(<VariantsOverviewHarness />)
    await expectRowsSettled(2)

    const banner = page.getByTestId('variants-beta-banner')
    await expect
      .element(banner)
      .toHaveTextContent('Content Variants is in open beta. Share feedback with Sanity')
    await expect.element(page.getByTestId('variants-feedback-button')).not.toBeInTheDocument()

    await userEvent.click(banner.getByRole('button', {name: 'Share feedback with Sanity'}))
    const dialog = page.getByRole('dialog')
    await expect
      .element(dialog.getByText('Share feedback with Sanity on versions and variants'))
      .toBeVisible()
    await expect
      .element(
        dialog.getByText(
          'How easy or difficult is it to create and manage document versions and variants?',
        ),
      )
      .toBeVisible()
  })

  it('swaps the banner for a header icon once dismissed, and remembers the dismissal', async () => {
    const {unmount} = await render(<VariantsOverviewHarness />)
    await expectRowsSettled(2)

    await userEvent.click(page.getByTestId('variants-beta-banner-dismiss'))
    await expect.element(page.getByTestId('variants-beta-banner')).not.toBeInTheDocument()
    const icon = page.getByTestId('variants-feedback-button')
    await expect.element(icon).toBeVisible()
    await expect.element(icon).toHaveAttribute('aria-label', 'Send feedback to Sanity')
    expect(window.localStorage.getItem(BANNER_DISMISSED_KEY)).toBe('true')

    await userEvent.click(icon)
    await expect
      .element(
        page.getByRole('dialog').getByText('Share feedback with Sanity on versions and variants'),
      )
      .toBeVisible()
    await userEvent.keyboard('{Escape}')

    // A later visit starts with the icon, not the banner
    await unmount()
    void render(<VariantsOverviewHarness />)
    await expectRowsSettled(2)
    await expect.element(page.getByTestId('variants-feedback-button')).toBeVisible()
    await expect.element(page.getByTestId('variants-beta-banner')).not.toBeInTheDocument()
    await settleChromaticEndState()
  })
})
