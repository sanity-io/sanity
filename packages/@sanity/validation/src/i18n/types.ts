import {type TFunction} from 'i18next'

export interface LocaleSource {
  currentLocale: {id: string}
  loadNamespaces(namespaces: string[]): Promise<void>
  t: TFunction
}
