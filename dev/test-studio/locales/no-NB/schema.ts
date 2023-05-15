/* eslint-disable camelcase */
import {LanguageBundle, typed} from 'sanity'
import {SchemaTranslations} from '../types'

export const schemaNamespace: Partial<SchemaTranslations> = {
  'pt_allTheBellsAndWhistles|title': 'Alle bjeller og fløyter',
  'pt_allTheBellsAndWhistles.title|title': 'Tittel',
  'pt_allTheBellsAndWhistles.text|title': 'Tekst',
}

export default typed<LanguageBundle>({
  namespace: 'schema',
  resources: schemaNamespace,
})
