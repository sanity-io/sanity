import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ResourceCacheProvider, useResourceCache} from '../../../../store/ResourceCacheProvider'
import {useWorkspace} from '../../../../studio/workspace'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
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
            <VariantsOverview />
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
