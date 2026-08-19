import {lazy} from 'react'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {type ObjectInputProps} from '../../form/types/inputProps'
import {variantsUsEnglishLocaleBundle} from '../i18n'

const VariantsTool = lazy(() =>
  import('../tool/VariantsTool').then((module) => ({default: module.VariantsTool})),
)
const VariantsStudioNavbar = lazy(() =>
  import('./components/VariantsStudioNavbar').then((module) => ({
    default: module.VariantsStudioNavbar,
  })),
)
const VariantsStudioLayout = lazy(() =>
  import('./VariantsStudioLayout').then((module) => ({default: module.VariantsStudioLayout})),
)
const VariantsDocumentInputLayout = lazy(() =>
  import('./VariantsDocumentInputLayout').then((module) => ({
    default: module.VariantsDocumentInputLayout,
  })),
)

/**
 * @internal
 */
export const VARIANTS_NAME = 'sanity/variants'

// Exported for the variant menu's "View variants" intent link.
export const VARIANTS_INTENT = 'variant'

const VARIANTS_TOOL_NAME = 'variants'

/**
 * @internal
 */
export const variants = definePlugin({
  name: VARIANTS_NAME,
  studio: {
    components: {
      layout: VariantsStudioLayout,
      navbar: VariantsStudioNavbar,
    },
  },
  // Observes which document is on screen so the perspective bar's dropdowns can
  // show which releases/variants it belongs to. Mirrors how the tasks plugin
  // reaches the same information.
  form: {
    components: {
      input: (props) => {
        if (props.id === 'root' && props.schemaType.type?.name === 'document') {
          return <VariantsDocumentInputLayout {...(props as ObjectInputProps)} />
        }

        return props.renderDefault(props)
      },
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
