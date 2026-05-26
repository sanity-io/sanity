import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {variantsUsEnglishLocaleBundle} from '../i18n'
import {VariantsTool} from '../tool/VariantsTool'
import {VariantsStudioNavbar} from './components/VariantsStudioNavbar'

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
      navbar: VariantsStudioNavbar,
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
