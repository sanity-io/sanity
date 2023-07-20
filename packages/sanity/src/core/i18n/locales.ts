import {defineLocale} from './defineHelpers'
import {studioDefaultLocaleResources} from './bundles/studio'

/**
 * The default US English locale for the studio.
 *
 * @beta
 */
export const usEnglishLocale = defineLocale({
  id: 'en-US',
  title: 'English (US)',
  bundles: [studioDefaultLocaleResources],
})

/**
 * The default locale for the studio.
 *
 * @beta
 */
export const defaultLocale = usEnglishLocale
