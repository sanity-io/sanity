import {copyPasteLocaleResources} from './bundles/copy-paste'
import {studioDefaultLocaleResources} from './bundles/studio'
import {validationLocaleResources} from './bundles/validation'
import {defineLocale} from './helpers'

/**
 * The default US English locale for the studio.
 *
 * @internal
 * @hidden
 */
export const usEnglishLocale = defineLocale({
  id: 'en-US',
  title: 'English (US)',
  bundles: [studioDefaultLocaleResources, validationLocaleResources, copyPasteLocaleResources],

  weekInfo: {
    firstDay: 7, // Sunday
    weekend: [6, 7], // Saturday, Sunday
    minimalDays: 1,
  },
})

/**
 * The default locale for the studio.
 *
 * @internal
 * @hidden
 */
export const defaultLocale = usEnglishLocale
