/* eslint-disable camelcase */
import {defineLanguageBundle, schemaI18nNamespace} from 'sanity'
import {TestStudioSchemaTranslations} from '../types'

export const schemaI18nNamespaceStrings: Partial<TestStudioSchemaTranslations> = {
  'i18nDocument.type-title': 'i18n: Norsk tittel',
  'i18nDocument.title.field-title': 'Tittel',
  'i18nDocument.title.field-description': 'Tittelbeskrivelse',
  'i18nDocument.array.field-title': 'Liste',
  'i18nDocument.array.field-description': 'Listebeskrivelse',
  'i18nDocument.ref.field-title': 'Referanse',
  'i18nDocument.ref.field-description': 'Referansebeskrivelse',

  'i18nDocument.fieldset.fieldset-title': 'Feltsett',
  'i18nDocument.fieldset.fieldset-description': 'Beskrivelse for feltsett',

  'i18nDocument.group.group-title': 'Gruppe',

  'i18nArray.book.item-title': 'Book (en)',

  'i18nRef.book.ref-title': 'Book (en)',
}

export default defineLanguageBundle({
  namespace: schemaI18nNamespace,
  resources: schemaI18nNamespaceStrings,
})
