import {defineField} from 'sanity'

/**
 * The language of a document, for the document-level localization plugin (@sanity/document-internationalization, `languageField: 'language'`).
 * Hidden and read-only: the plugin sets it. Present on the Nordic Books content types, set to `en` on the originals (seed/seed-translations.mts).
 */
export const languageField = defineField({
  name: 'language',
  type: 'string',
  readOnly: true,
  hidden: true,
})
