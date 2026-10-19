// The design set: one entry per handoff component (C1 to C8), each with any number of options.
// Two options is the rule from the calls, but nothing here assumes it: add a third by adding an
// entry to `options`. `final` marks the chosen option once the design is signed off.

import {defineDesignOptions, getComponent} from '../design-options/config'
import type {ComponentDef, DiagramSpec, OptionStatus} from '../design-options/types'

import presets from './presets.json'

export type {ComponentDef, OptionStatus}
export {getComponent}

export const COMPONENTS: ComponentDef[] = [
  {
    id: 'c1',
    title: 'C1 Perspective bar',
    defaultOption: 'a',
    cover: "How an editor reaches document state and variants from the top right of any Studio, and how the composed address (the perspective bar) opens and closes. Option A: one control (version pill); with a dimension set, the label shows or hides the row, and the version menu has one row that adds a dimension. Option B: two controls, document state and Variants, with one panel. Both share the row and the picker.",
    scope: "Open beta",
    pick: "Fork picked on 19 Oct: A one control, B two controls with a mega panel",
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
    cover: "Draft and Published in the document header, plus a Versions button that opens the inventory pane. Releases move to their own dropdown.",
    scope: "Open beta",
    pick: "Lean: Draft/Published plus Versions button; toggle still open. The Figma drafts of 19 Oct (A grouped dropdowns, B per-axis controls) refine this; the cover text is the older lean.",
    built: true,
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
    cover: "Icon button on list rows that have versions. Hover opens a popover (full list when few versions; first 5 and \"See all N in inventory\" when many). Click opens the pane with the document loaded.",
    scope: "Open beta",
    pick: "Picked on the 16 Oct call; v1 read-only popover, v2 flyout decided with engineering on 19 Oct",
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
    cover: "Side pane, document lens. Selecting a row must not swap or shift the toolbar. Filters, grouping and saved views are fast follows.",
    scope: "Open beta",
    pick: "Picked: pane; views are fast follow",
    built: true,
    where: 'Open a document, then the inspector "Versions" (Option B).',
    options: [
      {
        id: 'a',
        label: 'Sidebar / pane',
        summary: "Andrej's inventory side panel (Storybook PR #47) as the document inspector, live data. V1: not carried over, the navbar eye and the bulk bar.",
        status: 'candidate',
        story: 'explorations-variants-variant-inventory-side-panel-c4-version-inventory-pane',
      },
      {
        id: 'b',
        label: 'Popover from Manage versions',
        summary: "The same inventory panel (Andrej's), opened as a popover from a Manage versions button under the pane header.",
        status: 'candidate',
      },
      {
        id: 'c',
        label: 'List only',
        summary: 'The earlier simple version list in the document inspector: base first, then variants, with state and time.',
        status: 'exploration',
      },
    ],
  },
  {
    id: 'c5',
    title: 'C5 Inventory table',
    defaultOption: 'a',
    cover: "One table in four lenses: document, definition, dimension, resolution. Document lens in scope; the others are parked.",
    scope: "Document lens: open beta. Others: parked",
    pick: "Concept; the spec frame is on this page",
    where: 'Design slots tool.',
    options: [
      {id: 'a', label: 'One surface, a View by switch', summary: 'One table with a View by switch (Document, Definition, Dimension, Visitor) and a pin picker.', status: 'candidate', refs: 'Spec frame in Figma E5'},
      {id: 'b', label: 'Lenses at their pins', summary: 'Each lens lives at its pin: Document in the document, Definition and Dimension in the Variants tool, Visitor in the preview.', status: 'candidate'},
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
  {
    id: 'c6',
    title: 'C6 Variants tool',
    defaultOption: 'a',
    cover: "Definitions list, definition detail, documents table, create and edit dialogs. As shipped today.",
    scope: "Open beta (as shipped)",
    pick: "No change; table stakes",
    where: 'Design slots tool.',
    options: [
      {id: 'a', label: 'As today', summary: 'The Variants tool as the definition lens of the table.', status: 'candidate', refs: 'Figma E6'},
      {id: 'b', label: 'Not drawn', summary: 'A second option, if one is drawn.', status: 'exploration'},
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
  {
    id: 'c7',
    title: 'C7 Banners',
    defaultOption: 'a',
    cover: "The banner (or its absence) on a document that has no version for the variant the studio shows, in Drafts, Published and a release, with progress and not-found. Option A: an explicit banner with Create variant, always. Option B: always live in Drafts, with a header hint; banner only for Published and releases.",
    scope: "Open beta",
    pick: "Fork drawn 19 Oct",
    built: true,
    where: 'Open a document with a variant chosen in the row: a V1 banner at the top of the pane.',
    options: [
      {
        id: 'a',
        label: 'Explicit banner',
        summary: 'An explicit banner on a document with no version for the shown variant: "Create variant".',
        status: 'candidate',
        refs: 'Figma C7 225:437',
      },
      {
        id: 'b',
        label: 'Always live in Drafts',
        summary: 'In Drafts no banner, a header hint says the first edit creates the variant; banners for Published and releases.',
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
    cover: "Releases table aligned with the variants table. Polish only.",
    scope: "Fast follow",
    pick: "Polish only",
    where: 'Design slots tool.',
    options: [
      {id: 'a', label: 'Table, polished', summary: 'Aligned with C6; polish only.', status: 'candidate', refs: 'Figma E8'},
      {id: 'b', label: 'Not drawn', summary: 'A second option, if one is drawn.', status: 'exploration'},
      {id: 'c', label: 'Not drawn', summary: 'A third option, if one is drawn.', status: 'exploration'},
    ],
  },
]

// One line per option for the cards (from the Figma frames, 19 Oct).
const ONE_LINERS: Record<string, Record<string, string>> = {
  c1: {
    a: 'The version pill with a label that shows or hides the row; the menu adds a dimension.',
    b: 'A state pill plus a Variants control that opens one panel.',
  },
  c2: {
    a: 'Published and Draft stay pills; releases and variants fold into dropdowns.',
    b: 'One control for the version and one for the variant of this document.',
  },
  c3: {
    a: 'Icon on every row; hover opens a read-only popover; click opens document and inventory.',
    b: 'The same icon with a flyout menu of versions.',
    c: 'Exploration: the status dot is the control.',
  },
  c4: {
    a: 'Versions in the document inspector, right of the form.',
    b: 'The inventory opens as a popover from Manage versions.',
    c: 'The versions of this document as a plain list in the inspector.',
  },
  c5: {a: 'One surface with a View by switch and a pin picker.', b: 'The lenses live at their pins, on one shared table.'},
  c6: {a: 'Definitions as rows, with the documents that miss each.'},
  c7: {
    a: 'A banner on a missing variant, with Create variant, in every version.',
    b: 'No banner in Drafts; a hint in the pane header. Banner only in Published and releases.',
  },
  c8: {a: 'Releases as rows: documents, variants, schedule.'},
}

// Diagram data on the 200 x 100 grid: the part that changes.
const rows = [24, 38, 52, 66, 80]
const DIAGRAMS: Record<string, Record<string, DiagramSpec>> = {
  c1: {
    a: {shapes: [{kind: 'pill', x: 160, y: 3, w: 26}, {kind: 'box', x: 1, y: 13, w: 198, h: 8}]},
    b: {shapes: [{kind: 'pill', x: 140, y: 3, w: 16}, {kind: 'pill', x: 160, y: 3, w: 16}, {kind: 'box', x: 100, y: 14, w: 92, h: 42}]},
  },
  c2: {
    a: {shapes: [60, 88, 116, 144].map((x) => ({kind: 'pill' as const, x, y: 14.5, w: 24, h: 7}))},
    b: {shapes: [{kind: 'box', x: 60, y: 14.5, w: 40, h: 7}, {kind: 'box', x: 104, y: 14.5, w: 40, h: 7}]},
  },
  c3: {
    a: {shapes: [...rows.map((y) => ({kind: 'box' as const, x: 40, y: y + 0.5, w: 7, h: 7})), {kind: 'box', x: 30, y: 34, w: 42, h: 22}]},
    b: {
      shapes: [
        ...rows.map((y) => ({kind: 'box' as const, x: 40, y: y + 0.5, w: 7, h: 7})),
        {kind: 'box', x: 30, y: 34, w: 34, h: 26},
        {kind: 'box', x: 66, y: 34, w: 30, h: 20},
      ],
    },
    c: {shapes: rows.map((y) => ({kind: 'dot' as const, x: 44, y: y + 4}))},
  },
  c4: {
    a: {frame: 'inspector', shapes: [{kind: 'box', x: 144, y: 12.5, w: 55, h: 87}]},
    b: {shapes: [{kind: 'box', x: 96, y: 26, w: 64, h: 50}]},
    c: {frame: 'inspector', shapes: [24, 36, 48].map((y) => ({kind: 'box' as const, x: 148, y, w: 47, h: 6}))},
  },
  c5: {a: {shapes: [{kind: 'box', x: 56, y: 28, w: 140, h: 62}]}, b: {shapes: [{kind: 'box', x: 56, y: 28, w: 88, h: 62}, {kind: 'box', x: 148, y: 28, w: 48, h: 62}]}},
  c6: {a: {shapes: [{kind: 'box', x: 56, y: 28, w: 140, h: 62}]}},
  c7: {
    a: {shapes: [{kind: 'box', x: 53, y: 25, w: 143, h: 10}]},
    b: {shapes: [{kind: 'box', x: 130, y: 14.5, w: 60, h: 5}]},
  },
  c8: {a: {shapes: [{kind: 'box', x: 56, y: 28, w: 140, h: 62}]}},
}

// Storybook story ids (from Storybook-Agent, 19 Oct). Opens at `<base>/?path=/story/<id>`.
// Components with only one story link it from option A. C3 C is the dot-control exploration.
const STORIES: Record<string, Record<string, string>> = {
  c1: {
    a: 'explorations-variants-2-0-c1-perspective-selector-option-a--rest',
    b: 'explorations-variants-2-0-c1-perspective-selector-option-b--rest',
  },
  c2: {
    a: 'explorations-variants-2-0-c2-document-pills-option-a--at-rest',
    b: 'explorations-variants-2-0-c2-document-pills-option-b--at-rest',
  },
  c3: {
    a: 'explorations-variants-2-0-components-c3-version-mark--default',
    b: 'explorations-variants-2-0-c3-version-mark-popover-as-list--many',
    c: 'explorations-variants-2-0-c3-version-mark-option-b--list-default',
  },
  c4: {a: 'explorations-variants-variant-inventory-side-panel-c4-version-inventory-pane'},
  c5: {a: 'explorations-variants-2-0-components-c5-inventory-table--document-lens'},
  c6: {a: 'explorations-variants-2-0-components-c6-variants-tool--definitions-list'},
  c7: {
    a: 'explorations-variants-2-0-c7-banners-option-a--drafts-no-variant',
    b: 'explorations-variants-2-0-c7-banners-option-b--drafts-live',
  },
  c8: {a: 'explorations-variants-2-0-components-c8-releases-view--stub'},
}

for (const component of COMPONENTS) {
  for (const option of component.options) {
    const story = STORIES[component.id]?.[option.id]
    if (story) option.story = story
    const oneLiner = ONE_LINERS[component.id]?.[option.id]
    if (oneLiner) option.oneLiner = oneLiner
    const diagram = DIAGRAMS[component.id]?.[option.id]
    option.diagram = diagram ?? {dashed: true}
  }
}

defineDesignOptions({
  title: 'Design options',
  storageKey: 'variants-2-0-studio',
  components: COMPONENTS,
  groups: [
    {label: 'Studio chrome', ids: ['c1', 'c2', 'c3']},
    {label: 'Inventory', ids: ['c4', 'c5', 'c6']},
    {label: 'Document', ids: ['c7']},
    {label: 'Releases', ids: ['c8']},
  ],
  scenario: {
    stages: [
      {id: 'open-beta', label: 'Open beta'},
      {id: 'ga', label: 'GA'},
    ],
    dimensionsStage: 'ga',
    dimensions: [
      {value: null, label: 'All', title: 'Show every dimension'},
      {value: 1, label: '1', title: 'One list'},
      {value: 2, label: '2', title: 'Two columns'},
      {value: 5, label: '5', title: 'Five and more: the rail'},
    ],
  },
  presets,
  links: {
    figmaFile: 'https://www.figma.com/design/C1T4EUScc9PMf5tqNo09Qs',
    storybookBase: 'https://sanity-studio-storybook-r4ildcrzv.sanity.dev',
  },
})

