import {defineLanguageBundle, schemaI18nNamespace} from 'sanity'

export const schemaI18nNamespaceStrings = {
  'pt_allTheBellsAndWhistles|title': 'All the bells',
  'pt_allTheBellsAndWhistles.title|title': 'Title (en)',
  'pt_allTheBellsAndWhistles.text|title': 'Text (en)',
}

export default defineLanguageBundle({
  namespace: schemaI18nNamespace,
  resources: schemaI18nNamespaceStrings,
})
