// The design set: one entry per handoff component (C1 to C8), each with any number of options.
// Two options is the rule from the calls, but nothing here assumes it: add a third by adding an
// entry to `options`. `final` marks the chosen option once the design is signed off.

export type OptionStatus = 'candidate' | 'final' | 'exploration'

export interface OptionDef {
  id: string
  label: string
  summary: string
  status: OptionStatus
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
    title: 'C1 Perspective selector',
    defaultOption: 'a',
    options: [
      {id: 'a', label: 'Dropdown + link', summary: 'Navbar dropdown with a secondary link to the bar.', status: 'candidate'},
      {id: 'b', label: 'Mega menu', summary: 'Hierarchy and addresses; two clicks to compose.', status: 'candidate'},
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
    title: 'C3 Version mark and list popover',
    defaultOption: 'a',
    options: [
      {id: 'a', label: 'v1 read-only popover', summary: 'Icon with state badge; read-only popover, newest edit first.', status: 'candidate'},
      {id: 'b', label: 'v2 flyout menu', summary: 'Clickable rows; needs a hover-intent surface.', status: 'candidate'},
      {id: 'c', label: 'Dot as control', summary: 'No icon; the dot opens the popover.', status: 'exploration'},
    ],
  },
  {
    id: 'c4',
    title: 'C4 Inventory pane',
    defaultOption: 'a',
    options: [
      {id: 'a', label: 'Sidebar / pane', summary: 'Pane beside the document.', status: 'candidate'},
      {id: 'b', label: 'Document inspector', summary: 'Attached to the document pane (engineering direction).', status: 'candidate'},
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
