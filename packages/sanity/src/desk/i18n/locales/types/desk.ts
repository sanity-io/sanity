import {typed} from 'sanity'
import {deskI18nNamespaceStrings} from '../en-US/desk'

/**
 * @alpha
 */
export type DeskTranslations = typeof deskI18nNamespaceStrings

export const i18nDeskNS = typed<keyof DeskTranslations>
