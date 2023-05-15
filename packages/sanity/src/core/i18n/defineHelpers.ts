import {typed} from '@sanity/types'
import {LanguageBundle} from '../config'

/**
 * Pass-trough function that provides type safety when defining a LanguageBundle.
 */
export const defineLanguageBundle = typed<LanguageBundle>
