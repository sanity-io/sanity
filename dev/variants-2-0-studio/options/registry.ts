// The design set: one entry per handoff component (C1 to C8), each with any number of options.
// Two options is the rule from the calls, but nothing here assumes it: add a third by adding an
// entry to `options`. `final` marks the chosen option once the design is signed off.

export type OptionStatus = 'candidate' | 'final' | 'exploration'

export interface OptionDef {
  id: string
  label: string
  summary: string
  status: OptionStatus
  /** Where the design lives: Figma node ids in the handoff file, spec docs. */
  refs?: string
}

export interface ComponentDef {
  id: string
  title: string
  options: OptionDef[]
  /** Option shown when nothing is selected and the global choice has no match. */
  defaultOption: string
  /** The signed-off option, once there is one. */
  final?: string
  /** True once the studio renders real UI for this component (not only a slot). */
  built?: boolean
  /** What the component is, in the words of its Figma cover frame (placeholder text until the cover is copied). */
  cover?: string
  /** Where it shows up in the studio. */
  where?: string
}

export const COMPONENTS: ComponentDef[] = [
  {
    id: 'c1',
    title: 'C1 Perspective bar',
    defaultOption: 'a',
    built: true,
    options: [
      {
        id: 'a',
        label: 'One control',
        summary: "Today's version pill; its menu gains \"Narrow by dimension…\", which opens the composed-address row.",
        status: 'candidate',
        refs: 'Figma C1 192:3135; capability matrix 197:4316; edge states 192:3143',
      },
      {
        id: 'b',
        label: 'Two controls',
        summary: 'Document state and Variants, top right. The chevron on Variants shows or hides the row; one panel, forms by dimension count (1, 2 to 4, 5+).',
        status: 'candidate',
        refs: 'Figma C1 192:3139; E1 "Variants control · 1 · The panel" 210:10464',
      },
    ],
  },
  {
    id: 'c2',
    title: 'C2 Document pills',
    defaultOption: 'a',
    built: true,
    cover: 'The document\'s versions as pills: Published, Draft, releases and variants, in the document pane.',
    where: 'Open a document: a V1 row under the pane header.',
    options: [
      {
        id: 'a',
        label: 'Grouped dropdowns',
        summary: 'Published and Draft stay pills; releases and variants each fold into one dropdown.',
        status: 'candidate',
        refs: 'Figma C2 227:1925; PARTS-C2 (DocumentPerspectiveList)',
      },
      {
        id: 'b',
        label: 'Per-axis controls',
        summary: 'One control per axis (state, audience, locale), each listing what this document has.',
        status: 'candidate',
        refs: 'Figma C2 227:1929',
      },
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
  {
    id: 'c3',
    title: 'C3 Document list overlay',
    defaultOption: 'a',
    built: true,
    options: [
      {
        id: 'a',
        label: 'v1 read-only popover',
        summary: 'A 25px versions control on every row; hover or focus opens a read-only 400px popover (nothing clickable inside); click opens the base document and the inventory.',
        status: 'candidate',
        refs: 'Figma C3 54:5163; list item types 54:8711',
      },
      {
        id: 'b',
        label: 'v2 flyout menu',
        summary: 'Clickable rows in a flyout that stays open while the pointer travels to it (needs a hover-intent surface).',
        status: 'candidate',
        refs: 'Figma C3 165:15923',
      },
      {id: 'c', label: 'Dot as control', summary: 'No icon; the dot opens the popover.', status: 'exploration'},
    ],
  },
  {
    id: 'c4',
    title: 'C4 Inventory pane',
    defaultOption: 'a',
    built: true,
    cover: 'Every version of one document, in one place: the document-group inventory.',
    where: 'Open a document, then the inspector "Versions" (Option B).',
    options: [
      {
        id: 'a',
        label: 'Sidebar / pane',
        summary: 'A pane beside the document. Arrives from the inventory side panel (Andrej, Storybook PR #47).',
        status: 'candidate',
      },
      {
        id: 'b',
        label: 'Document inspector',
        summary: 'Attached to the document pane (engineering direction). V1: the version list for this document.',
        status: 'candidate',
      },
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
  {
    id: 'c5',
    title: 'C5 Inventory table',
    defaultOption: 'a',
    cover: 'The inventory as a table, with four lenses. The sidebar is its smallest slice.',
    where: 'Design slots tool.',
    options: [
      {id: 'a', label: 'Table', summary: 'The table as the primary pattern; the sidebar is its smallest slice.', status: 'candidate', refs: 'Spec frame in Figma E5'},
      {id: 'b', label: 'Table + flyout', summary: 'Notion-like: table primary, the document form as a flyout (future).', status: 'exploration'},
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
  {
    id: 'c6',
    title: 'C6 Variants tool',
    defaultOption: 'a',
    cover: 'The Variants tool: the list of variant definitions and what uses them. No change from today.',
    where: 'Design slots tool.',
    options: [
      {id: 'a', label: 'As today', summary: 'The Variants tool as it is.', status: 'candidate', refs: 'Figma E6'},
      {id: 'b', label: 'Not drawn', summary: 'A second option, if one is drawn.', status: 'exploration'},
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
  {
    id: 'c7',
    title: 'C7 Banners',
    defaultOption: 'a',
    built: true,
    cover: 'What the document pane says about the version you are in: banners and header hints.',
    where: 'Open a document: a V1 banner at the top of the pane.',
    options: [
      {
        id: 'a',
        label: 'Explicit banner',
        summary: 'A banner always states the version and offers "Publish this draft".',
        status: 'candidate',
        refs: 'Figma C7 225:437',
      },
      {
        id: 'b',
        label: 'Always live in Drafts',
        summary: 'No banner; a hint in the header says edits are live in Drafts.',
        status: 'candidate',
        refs: 'Figma C7 225:441',
      },
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
  {
    id: 'c8',
    title: 'C8 Releases view',
    defaultOption: 'a',
    cover: 'The releases overview, aligned with the Variants tool. Polish only; fast follow.',
    where: 'Design slots tool.',
    options: [
      {id: 'a', label: 'Table, polished', summary: 'Aligned with C6; polish only.', status: 'candidate', refs: 'Figma E8'},
      {id: 'b', label: 'Not drawn', summary: 'A second option, if one is drawn.', status: 'exploration'},
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
]

export function getComponent(id: string): ComponentDef | undefined {
  return COMPONENTS.find((component) => component.id === id)
}
