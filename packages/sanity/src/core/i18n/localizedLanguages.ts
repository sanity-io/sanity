import {defineLanguage} from './defineHelpers'
import {USFlagIcon} from './icons/USFlagIcon'
import {defaultStudioLanguageBundle} from './bundles/studio'
import type {LanguageDefinition} from './types'

/**
 * Languages that the studio has available LanguageBundles for
 * @alpha
 */
export const localizedLanguages = {
  'en-US': defineLanguage({
    id: 'en-US',
    title: 'English (US)',
    icon: USFlagIcon,
    bundles: [defaultStudioLanguageBundle],
  }),
}

/**
 * @alpha
 */
export const defaultLanguage: LanguageDefinition = localizedLanguages['en-US']
