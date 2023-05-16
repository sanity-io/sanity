import {defineLanguageBundle, schemaI18nNamespace} from 'sanity'

export const schemaI18nNamespaceStrings = {
  'i18nDocument.type-title': 'i18n: English title',
  'i18nDocument.title.field-title': 'Title (en)',
  'i18nDocument.title.field-description': 'Title Description (en)',
  'i18nDocument.array.field-title': 'Array (en)',
  'i18nDocument.array.field-description': 'Array description (en)',
  'i18nDocument.ref.field-title': 'Ref (en)',
  'i18nDocument.ref.field-description': 'Ref description (en)',

  'i18nDocument.fieldset.fieldset-title': 'Fieldset (en)',
  'i18nDocument.fieldset.fieldset-description': 'Fieldset description (en)',

  'i18nDocument.group.group-title': 'Group (en)',
  'i18nDocument.group.group-description': 'Group description (en)',

  'i18nArray.book.item-title': 'Book (en)',

  'i18nRef.book.ref-title': 'Book (en)',
}

export default defineLanguageBundle({
  namespace: schemaI18nNamespace,
  resources: schemaI18nNamespaceStrings,
})
