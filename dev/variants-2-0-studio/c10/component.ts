import {type ComponentDef} from '../design-options/types'

// C10 Create pattern: one address picker across Studio (Figma C1T4EUScc9PMf5tqNo09Qs, section 656:16383, 1b "Creating from the
// structure"). A is stock Studio (no override), so the comparison is honest. B mounts c10/AddressPicker.tsx.
export const ADDRESS_PICKER: ComponentDef = {
  id: 'c10',
  title: 'C10 Create pattern · one address picker',
  defaultOption: 'a',
  // "Show" (All A, All B) does not move it: it stays stock until it is set on its own.
  independent: true,
  built: true,
  scope: 'GA candidate',
  cover:
    'Every new document has an address: what it is (type, variant), where it lives (Drafts or a release) and what it starts from (empty or a template). Today the navbar "+" and the structure "+" pick a type and open a blank document in the current perspective. The address picker shows the address beside the type list before the document is made.',
  pick: 'Vision, for comparison with today. The inventory Create version (C4 E) is the same pattern inside the version inventory.',
  where: 'The navbar "+" (New document) and the "+" in a document list pane header.',
  options: [
    {
      id: 'a',
      label: 'Today',
      summary:
        'Stock Studio. Picking a type in the navbar "+" or the structure "+" opens a blank document of that type in the current perspective, with the variant the navbar shows.',
      oneLiner: 'Pick a type: a blank document opens in the current perspective.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Address picker',
      summary:
        'Picking a type opens a compact form beside the type list: Type, Variant, Add to and Start from, each a dropdown with search. The defaults are the current perspective and the navbar variant, so Create document is ready at once. Escape or a click outside closes it. Create document makes the document at that address and opens it there in one navigation.',
      oneLiner:
        'Pick a type: a small form beside the list shows the address before Create document.',
      status: 'candidate',
      refs: 'Figma C4 page, section 656:16383, 1b: F1 658:5341 (list "+"), F2 658:5664 (navbar "+")',
    },
  ],
}
