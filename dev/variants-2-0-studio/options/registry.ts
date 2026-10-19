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
}

export const COMPONENTS: ComponentDef[] = [
  {
    id: 'c1',
    title: 'C1 Perspective bar',
    defaultOption: 'a',
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
    options: [
      {id: 'a', label: 'Pills + versions control', summary: 'Draft and Published pills plus one versions control.', status: 'candidate'},
      {id: 'b', label: 'Parallel concept set', summary: 'Needs the second concept set.', status: 'candidate'},
    ],
  },
  {
    id: 'c3',
    title: 'C3 Document list overlay',
    defaultOption: 'a',
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
    options: [
      {id: 'a', label: 'Sidebar / pane', summary: 'Pane beside the document.', status: 'candidate'},
      {id: 'b', label: 'Document inspector', summary: 'Attached to the document pane.', status: 'candidate'},
    ],
  },
  {
    id: 'c5',
    title: 'C5 Inventory table',
    defaultOption: 'a',
    options: [{id: 'a', label: 'Table', summary: 'Table as the primary pattern; sidebar is its smallest slice.', status: 'candidate'}],
  },
  {
    id: 'c6',
    title: 'C6 Variants tool',
    defaultOption: 'a',
    options: [{id: 'a', label: 'As today', summary: 'No change.', status: 'candidate'}],
  },
  {
    id: 'c7',
    title: 'C7 Banners',
    defaultOption: 'a',
    options: [{id: 'a', label: 'Top placement', summary: 'With "publish this draft".', status: 'candidate'}],
  },
  {
    id: 'c8',
    title: 'C8 Releases view',
    defaultOption: 'a',
    options: [{id: 'a', label: 'Table, polished', summary: 'Aligned with C6; polish only.', status: 'candidate'}],
  },
]

export function getComponent(id: string): ComponentDef | undefined {
  return COMPONENTS.find((component) => component.id === id)
}
