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
    'How teams localize in open beta, before variants: the document-level localization plugin gives each language its own document, joined by a metadata document. The Nordic Books content has Danish, Swedish and Norwegian versions.',
  pick: 'A scenario, not a design choice: it shows how the plugin sits next to the open beta designs. Open a book to see the menu.',
  where:
    'The document pane header (a language menu) and the document badges; open a book, series, publisher or place.',
  options: [
    {
      id: 'a',
      label: 'Plugin off',
      summary:
        'No plugin UI: the studio as it is. The translated documents are still in the dataset and in the lists.',
      oneLiner: 'No localization plugin UI.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Plugin on',
      summary:
        "The plugin's language menu in the document header (English, Danish, Swedish, Norwegian: open or create a version) and its language badge. Takes effect on the next document you open.",
      oneLiner: "The plugin's language menu and badge.",
      status: 'candidate',
      refs: '@sanity/document-internationalization 6.2.43',
    },
  ],
}

export const LOCALIZATION_GROUP = {label: 'Localization plugin', ids: ['localization']}
