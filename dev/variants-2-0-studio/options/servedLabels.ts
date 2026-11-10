// Served labels in the version inventory (GA lenses, 10 Nov 2026): which row says it is what visitors get. Source: the "Inventory Served Labels"
// page (7 states, 27 Oct) and the ranking rule Content Lake runs (ADR-3, c1/rank.ts). Tooltips say "closest match", never "highest priority".
import {type ComponentDef} from '../design-options/types'

export const SERVED_LABELS: ComponentDef = {
  id: 'servedLabels',
  tag: 'SL',
  title: 'Served labels',
  defaultOption: 'a',
  independent: true,
  built: true,
  scope: 'Future state',
  cover:
    'The version inventory marks the row a visitor gets. A: the proposal, "Served" whenever the visitor gets the variant the bar names, "Served instead" when another variant is served. B: no labels in the first iteration.',
  pick: 'Open a book, open Versions, then change the bar (Drafts, Published, a release; add Returning or New visitors). Hover the label for the reason.',
  where: 'A badge on one row of the inventory.',
  options: [
    {
      id: 'a',
      label: 'Served and Served instead',
      summary:
        '"Served" when the visitor gets the variant the bar names (also when it is read from Published because the variant has no draft). "Served instead" when the bar names a combination with no variant, or a variant with no version of this document, and another one is served: the closest match. The tooltip gives the reason.',
      oneLiner: 'The proposal: Served, Served instead.',
      status: 'candidate',
      refs: 'Inventory Served Labels page, 7 states (27 Oct)',
    },
    {
      id: 'b',
      label: 'No labels',
      summary:
        'The first iteration ships without Served labels. The inventory still highlights the rows as before; nothing says which row a visitor gets.',
      oneLiner: 'No labels.',
      status: 'candidate',
    },
  ],
}
