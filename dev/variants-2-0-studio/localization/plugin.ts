import {documentInternationalization} from '@sanity/document-internationalization'
import {definePlugin} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

import {getOptionState} from '../design-options/store'

// The document-level localization plugin (@sanity/document-internationalization), switchable from Design options (`localization`: A off, B on).
// The plugin is configured once and always registered (its `translation.metadata` type and the `language` field are in the schema either way);
// what the switch turns on and off is what the plugin DRAWS: the language menu in the document header (`unstable_languageFilter`) and the
// language badge. Both are resolved each time a document opens, so the switch takes effect on the next document you open.

/** The types that are localized: the Nordic Books content. (Authors are people's names, and the E9 fixtures are test data.) */
export const LOCALIZED_TYPES = ['book', 'bookLive', 'series', 'publisher', 'place']

export const LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'da', title: 'Danish'},
  {id: 'sv', title: 'Swedish'},
  {id: 'nb', title: 'Norwegian'},
]

// The switch: A off, B the document-level plugin, C the field-level plugin, D both.
const mode = () => getOptionState().overrides.localization ?? 'a'
export const documentLevelOn = () => mode() === 'b' || mode() === 'd'
export const fieldLevelOn = () => mode() === 'c' || mode() === 'd'
const on = documentLevelOn

const base = documentInternationalization({
  supportedLanguages: LANGUAGES,
  schemaTypes: LOCALIZED_TYPES,
  languageField: 'language',
})

// The plugin's resolvers are functions; `badges` may also be a plain array in the type, so each is checked before it is called.
export const localization = definePlugin(() => {
  const {unstable_languageFilter: languageFilter, badges} = base.document ?? {}
  return {
    ...base,
    document: {
      ...base.document,
      unstable_languageFilter: (prev, ctx) =>
        on() && typeof languageFilter === 'function' ? languageFilter(prev, ctx) : prev,
      badges: (prev, ctx) => (on() && typeof badges === 'function' ? badges(prev, ctx) : prev),
    },
  }
})

/** The types stored the field-level way: one document, every language inside its fields. */
export const FIELD_LEVEL_TYPES = ['bookFieldLevel']

/**
 * The field-level plugin (sanity-plugin-internationalized-array) with its built-in language filter, on the field-level types only. The type is
 * listed only while the switch is C or D (localization/structure.ts), so with it off nothing of this is visible.
 */
export const fieldLevel = internationalizedArray({
  languages: LANGUAGES,
  defaultLanguages: ['en'],
  fieldTypes: ['string', 'text'],
  languageFilter: {documentTypes: FIELD_LEVEL_TYPES},
})
