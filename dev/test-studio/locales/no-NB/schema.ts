/* eslint-disable camelcase */
import {defineLanguageBundle, schemaI18nNamespace} from 'sanity'
import {TestStudioSchemaTranslations} from '../types'

export const schemaI18nNamespaceStrings: Partial<TestStudioSchemaTranslations> = {
  'pt_allTheBellsAndWhistles|title': 'Alle bjeller og fløyter',
  'pt_allTheBellsAndWhistles.title|title': 'Tittel',
  'pt_allTheBellsAndWhistles.text|title': 'Tekst',
}

export default defineLanguageBundle({
  namespace: schemaI18nNamespace,
  resources: schemaI18nNamespaceStrings,
})
