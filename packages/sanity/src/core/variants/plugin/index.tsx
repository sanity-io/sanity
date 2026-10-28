import {lazy} from 'react'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {variantsUsEnglishLocaleBundle} from '../i18n'

const VariantsTool = lazy(() => import('../tool/VariantsTool'))

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
  tools: [
    {
      name: VARIANTS_TOOL_NAME,
      title: 'Variants',
      component: VariantsTool,
      router: route.create('/', [route.create('/:variantId')]),
      __internalApplicationType: VARIANTS_NAME,
      canHandleIntent: (intent) => intent === VARIANTS_INTENT,
      getIntentState(intent, params) {
        // No id opens the tool root, the variants overview. An id opens that variant.
        if (intent === VARIANTS_INTENT && typeof params.id === 'string') {
          return {variantId: params.id}
        }
        return {}
      },
    },
  ],
  i18n: {
    bundles: [variantsUsEnglishLocaleBundle],
  },
})
