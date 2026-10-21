import {defineField, defineType} from 'sanity'

// A book as ONE document with every language inside its fields (the field-level localization plugin, sanity-plugin-internationalized-array):
// the title, the blurb and the button label are arrays of per-language values. The same books exist as separate documents per language for the
// document-level plugin (seed/seed-translations.mts), so the two approaches can be compared on the same content.
export const bookFieldLevel = defineType({
  name: 'bookFieldLevel',
  title: 'Book (field-level)',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'internationalizedArrayString'}),
    defineField({name: 'subtitle', type: 'string', description: 'The same in every language'}),
    defineField({name: 'blurb', type: 'internationalizedArrayText'}),
    defineField({name: 'cta', type: 'internationalizedArrayString', title: 'Button label'}),
  ],
  preview: {select: {title: 'title.0.value', subtitle: 'subtitle'}},
})
