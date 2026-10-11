import {lazy, useEffect} from 'react'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {variantsUsEnglishLocaleBundle} from '../i18n'

const VariantsTool = lazy(() => import('../tool/VariantsTool'))

const lazyVariantsStudioNavbarLayout = () => import('./components/VariantsStudioNavbarLayout')
const VariantsStudioNavbarLayout = lazy(lazyVariantsStudioNavbarLayout)

/**
 * @internal
 */
export const VARIANTS_NAME = 'sanity/variants'

/**
 * @internal
 */
export const VARIANTS_INTENT = 'variant'

const VARIANTS_TOOL_NAME = 'variants'

/**
 * @internal
 */
export const variants = definePlugin({
  name: VARIANTS_NAME,
  studio: {
    components: {
      provider: VariantsStudioProvider,
      navbar: VariantsStudioNavbarLayout,
    },
  },
  tools: [
    {
      name: VARIANTS_TOOL_NAME,
      title: 'Variants',
      component: VariantsTool,
      router: route.create('/', [route.create('/:variantId')]),
      __internalApplicationType: VARIANTS_NAME,
      canHandleIntent: (intent) => intent === VARIANTS_INTENT,
      getIntentState(intent, params) {
        if (intent === VARIANTS_INTENT) {
          return {variantId: params.id}
        }
        return null
      },
    },
  ],
  i18n: {
    bundles: [variantsUsEnglishLocaleBundle],
  },
})

function VariantsStudioProvider(props: ProviderProps) {
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyVariantsStudioNavbarLayout()
  }, [])

  return props.renderDefault(props)
}
