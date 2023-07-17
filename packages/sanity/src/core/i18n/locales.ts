import {defineLocale} from './defineHelpers'
import {USFlagIcon} from './icons/USFlagIcon'
import {studioDefaultLocaleResources} from './bundles/studio'

/**
 * The default US English locale for the studio.
 *
 * @beta
 */
export const usEnglishLocale = defineLocale({
  id: 'en-US',
  title: 'English (US)',
  icon: USFlagIcon,
  bundles: [studioDefaultLocaleResources],
})

/**
 * The default locale for the studio.
 *
 * @beta
 */
export const defaultLocale = usEnglishLocale
