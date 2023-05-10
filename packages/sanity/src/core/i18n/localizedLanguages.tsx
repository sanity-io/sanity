import React from 'react'
import {typed} from '@sanity/types'
import {LanguageDefinition} from '../config'

/**
 * Languages that the studio has available LanguageBundles for
 * @alpha
 */
export const localizedLanguages = {
  'en-US': typed<LanguageDefinition>({
    id: 'en-US',
    title: 'English (US)',
    //FIXME windows does not support these unicode characters
    icon: () => <>🇺🇸</>,
  }),
  'no-NB': typed<LanguageDefinition>({
    id: 'no-NB',
    title: 'Bokmål',
    //FIXME windows does not support these unicode characters
    icon: () => <>🇳🇴</>,
  }),
}

/**
 * @alpha
 */
export const defaultLanguage: LanguageDefinition = localizedLanguages['en-US']
