import {type ComponentDef} from '../design-options/types'

// C12 Version sorting (27 Oct, Faheem): the order of the rows in the version menus, the document pills' Variants and Releases menus (C2 A)
// and the Other versions menu (C2 B). A keeps the order they have today. B sorts them with c12/sortVersions.ts. The navbar's state menu is
// core's GlobalPerspectiveMenu (not edited here), so it keeps its own order with both options.
export const VERSION_SORTING: ComponentDef = {
  id: 'c12',
  title: 'C12 Version sorting',
  defaultOption: 'a',
  // "Show" (All A, All B) does not move it: it stays as today until it is set on its own.
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'The order of the rows in the version menus of the document pills. Today they come in the order the data gives them: the versions of the document, then the ones it has not. Option B sorts them by one rule, so that a long menu reads the same on every document.',
  pick: 'Compare on a document with several variants and releases, with C2 A (the Variants and Releases pills) or C2 B (Other versions).',
  where:
    'Open a document: the Variants and Releases menus of the document pills (C2 A), or the Other versions menu (C2 B).',
  options: [
    {
      id: 'a',
      label: 'Today',
      summary:
        'The rows in the order they have today: in the Variants menu, the default, then the variants this document has, then the ones it has not; in the Releases menu, the releases this document is in, then the other active releases.',
      oneLiner: 'The rows in the order the data gives them.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Sorted',
      summary:
        'One rule for every version menu: Published, then Drafts; then the open releases, the soonest intended publish date first (ASAP before dated, undecided last); then the scheduled releases by date. In one place the base comes first and its variants after it. Then the versions this document has before the ones it has not, and ties by title, A to Z.',
      oneLiner: 'Published, Drafts, releases by date, scheduled last; titles A to Z.',
      status: 'candidate',
    },
  ],
}
