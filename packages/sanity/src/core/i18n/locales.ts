import {studioAuthLocaleResources} from './bundles/auth'
import {validationLocaleResources} from './bundles/validation'
import {defineLocale, defineLocaleResourceBundle} from './helpers'
import {
  copyPasteLocalNamespace,
  feedbackLocaleNamespace,
  studioLocaleNamespace,
} from './localeNamespaces'

const studioDefaultLocaleResources = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: studioLocaleNamespace,
  resources: () => import('./bundles/studio').then(({studioLocaleStrings}) => studioLocaleStrings),
})

const copyPasteLocaleResources = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: copyPasteLocalNamespace,
  resources: () =>
    import('./bundles/copy-paste').then(({copyPasteLocaleStrings}) => copyPasteLocaleStrings),
})

const feedbackLocaleResources = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: feedbackLocaleNamespace,
  resources: () =>
    import('./bundles/feedback').then(({feedbackLocaleStrings}) => feedbackLocaleStrings),
})

/**
 * The default US English locale for the studio.
 *
 * @internal
 * @hidden
 */
export const usEnglishLocale = defineLocale({
  id: 'en-US',
  title: 'English (US)',
  bundles: [
    studioAuthLocaleResources,
    studioDefaultLocaleResources,
    validationLocaleResources,
    copyPasteLocaleResources,
    feedbackLocaleResources,
  ],

  weekInfo: {
    firstDay: 7, // Sunday
    weekend: [6, 7], // Saturday, Sunday
  },
})

/**
 * The default locale for the studio.
 *
 * @internal
 * @hidden
 */
/** @alias */
export const defaultLocale = usEnglishLocale
