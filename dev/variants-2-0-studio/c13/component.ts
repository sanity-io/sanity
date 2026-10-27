import {type ComponentDef} from '../design-options/types'

// C13 Add variant entry points (27 Oct, Faheem): where an editor can start a variant. A adds none, so the comparison is honest. B adds them all:
// Add variant in the document's action menu right after Publish (c4/AddVariantAction.tsx, as in the Handoff Studio), and "<Type> as a variant…"
// in the create menus, the navbar "+" and a list pane's "+" (c13/NewDocumentAsVariant.tsx). Every entry ends in the version inventory's Create
// version mode, which is C4 E's (Open beta (locked) uses it).
export const ADD_VARIANT_ENTRY_POINTS: ComponentDef = {
  id: 'c13',
  title: 'C13 Add variant entry points',
  defaultOption: 'a',
  // "Show" (All A, All B) does not move it: it stays as today until it is set on its own.
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'Where an editor starts a variant. Today the only ways in are the Variants pill and the banner. Option B adds the places editors already look when they create: the document action menu, and the new-document menus. Each one opens the version inventory in Create version mode, so the create itself stays in one place.',
  pick: 'Set C4 to E (or use Open beta (locked)) to see the Create version mode; with another C4 option the inventory opens as that option draws it.',
  where:
    'Open a document: the action menu beside Publish. The navbar "+" (New document) and the "+" in a document list pane header.',
  options: [
    {
      id: 'a',
      label: 'None',
      summary:
        'No added entry points: the Variants pill, the banner and the inventory are the ways to create a variant, as today.',
      oneLiner: 'No added entry points.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'All',
      summary:
        'Add variant in the document action menu, right after Publish (shown while any variant is defined): it opens the version inventory in Create version mode. In the navbar "+" and a list pane\'s "+", one more item per type, "<Type> as a variant…": it saves a new draft of that type with the type\'s initial value, opens it, and opens its version inventory in Create version mode, where the editor picks the variant and where it goes.',
      oneLiner: 'Add variant after Publish, and "<Type> as a variant…" in the create menus.',
      status: 'candidate',
      refs: 'Handoff Studio 0f62e9fc51 (the document action)',
    },
  ],
}
