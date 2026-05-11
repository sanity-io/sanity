import {definePlugin} from '../../config/definePlugin'
import {variantsUsEnglishLocaleBundle} from '../i18n'
import {VariantsStudioNavbar} from './components/VariantsStudioNavbar'
/**
 * @internal
 */
export const VARIANTS_NAME = 'sanity/variants'

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
  i18n: {
    bundles: [variantsUsEnglishLocaleBundle],
  },
})
