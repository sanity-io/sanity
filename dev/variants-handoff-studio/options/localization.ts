// The localization plugin scenario: the document-level plugin (@sanity/document-internationalization) is off (today's open beta, no plugin UI)
// or on (its language menu in the document header and its language badge). The translated documents are in the dataset either way
// (seed/seed-translations.mts); the switch changes what the studio draws. Independent: "Show" (All A, All B) does not move it.
import {type ComponentDef} from '../design-options/types'

export const LOCALIZATION: ComponentDef = {
  id: 'localization',
  tag: 'LZ',
  title: 'Localization plugin',
  defaultOption: 'a',
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'How teams localize in open beta, before variants. Document-level: each language is its own document, joined by a metadata document. Field-level: one document with every language inside its fields. The Nordic Books content has Danish, Swedish and Norwegian versions both ways.',
  pick: 'A scenario, not a design choice: it shows how the plugin sits next to the open beta designs. Open a book to see the menu.',
  where:
    'The document pane header (a language menu or filter), the navbar (a locale pill, field-level) and the lists; open a book, series, publisher or place.',
  options: [
    {
      id: 'a',
      label: 'Plugin off',
      summary:
        'No plugin UI: the studio as it is. The Content list shows English documents only (the translated documents and the field-level books are in the dataset, not listed).',
      oneLiner: 'No localization plugin UI.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Document-level plugin',
      summary:
        "@sanity/document-internationalization: each language is its own document, joined by a metadata document. Its Translations menu in the document header (English, Danish, Swedish, Norwegian: open or create a version) and its language badge. The lists show every language's documents.",
      oneLiner: 'One document per language; a Translations menu.',
      status: 'candidate',
      refs: '@sanity/document-internationalization 6.2.43',
    },
    {
      id: 'c',
      label: 'Field-level plugin',
      summary:
        'sanity-plugin-internationalized-array with its language filter: ONE document per book with every language inside its fields (the "Book (field-level)" list). The filter button in the document header and a locale pill in the navbar choose which languages the form shows.',
      oneLiner: 'One document, every language in its fields; a locale pill.',
      status: 'candidate',
      refs: 'sanity-plugin-internationalized-array 5.3.6, @sanity/language-filter 5.0.23',
    },
    {
      id: 'd',
      label: 'Both',
      summary:
        'The document-level and the field-level plugins together, side by side: the same books stored both ways, to compare.',
      oneLiner: 'Both approaches at once.',
      status: 'exploration',
    },
  ],
}

export const LOCALIZATION_GROUP = {label: 'Localization plugin', ids: ['localization']}
