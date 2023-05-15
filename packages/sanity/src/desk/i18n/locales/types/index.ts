import {deskI18nNamespace} from '../../i18nNamespaces'
import {type DeskTranslations} from './desk'

export * from './desk'

declare module 'sanity' {
  interface SanityResources {
    [deskI18nNamespace]: DeskTranslations
  }
}
