import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {RhombusIcon} from '../../../../components/temporary-icons/Rhombus'
import {useResourceCache} from '../../../../store/ResourceCacheProvider'
import {useWorkspace} from '../../../../studio/workspace'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type VariantStore} from '../../../store/createVariantsStore'
import {type VariantStoreState} from '../../../store/reducer'
import {VariantsMenu} from '../VariantsMenu'

const LOADED_STATE: VariantStoreState = {
  variants: new Map([
    [variantAlphaAudience._id, variantAlphaAudience],
    [variantNorwegianMarket._id, variantNorwegianMarket],
  ]),
  state: 'loaded',
}

const SEEDED_VARIANTS_STORE: VariantStore = {
  state$: of(LOADED_STATE),
  initialState: LOADED_STATE,
  dispatch: () => undefined,
}

/**
 * `useVariantsStore` keeps one store per workspace in the resource cache and
 * only creates a fresh one on a miss, so seeding the cache before the menu
 * mounts is how the fixture variants reach it without a client that can answer
 * the variants query. Runs once per mount, before the children render.
 */
function SeedVariantsStore({children}: {children: ReactNode}) {
  const workspace = useWorkspace()
  const resourceCache = useResourceCache()
  useState(() => {
    resourceCache.set({
      dependencies: [workspace],
      namespace: 'VariantsStore',
      value: SEEDED_VARIANTS_STORE,
    })
    return true
  })

  return children
}

/**
 * The perspective bar's variant picker with two fixture variants and the
 * default variant selected. The menu is opened by the story's `play`
 * function; the harness only sets up the trigger and the seeded store.
 */
export function VariantsMenuStory() {
  return (
    <TestWrapper
      betaFeatures={{variants: {enabled: true}}}
      i18nBundles={[variantsUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <SeedVariantsStore>
        <Flex alignItems="flex-start" justifyContent="flex-end" style={{minHeight: 360}}>
          <VariantsMenu
            trigger={
              <Button
                data-testid="variants-nav-menu-button"
                icon={RhombusIcon}
                iconRight={ChevronDownIcon}
                mode="bleed"
                text="All users (Default)"
              />
            }
          />
        </Flex>
      </SeedVariantsStore>
    </TestWrapper>
  )
}
