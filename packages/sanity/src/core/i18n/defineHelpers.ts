import {typed} from '@sanity/types'
import type {LanguageBundle} from '../config'

/**
 * Pass-trough function that provides type safety when defining a LanguageBundle.
 * @alpha
 */
export const defineLanguageBundle = typed<LanguageBundle>
