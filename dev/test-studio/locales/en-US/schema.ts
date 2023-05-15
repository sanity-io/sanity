import {LanguageBundle, typed} from 'sanity'

export const schemaNamespace = {
  'pt_allTheBellsAndWhistles|title': 'All the bells',
  'pt_allTheBellsAndWhistles.title|title': 'Title (en)',
  'pt_allTheBellsAndWhistles.text|title': 'Text (en)',
}

export default typed<LanguageBundle>({
  namespace: 'schema',
  resources: schemaNamespace,
})
