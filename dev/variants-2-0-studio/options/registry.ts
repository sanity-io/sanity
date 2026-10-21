// The design set: one entry per handoff component (C1 to C8), each with any number of options.
// Two options is the rule from the calls, but nothing here assumes it: add a third by adding an
// entry to `options`. `final` marks the chosen option once the design is signed off.

import {defineDesignOptions, getComponent} from '../design-options/config'
import {
  type ComponentDef,
  type DiagramFile,
  type DiagramSpec,
  type OptionStatus,
} from '../design-options/types'
import diagrams from './diagrams.json'
import {
  E9_COMPONENTS,
  E9_GROUP,
  LOCAL_MATCH,
  NAV_LAYOUT,
  PANE_CONTROL,
  REVIEW_SET,
  ROW_WIDTH,
} from './e9'
import {ICONOGRAPHY_GROUP, MARK_SELECTED} from './iconography'
import {INSPECTOR_SWITCHER} from './inspectorSwitcher'
import {LOCALIZATION, LOCALIZATION_GROUP} from './localization'
import presets from './presets.json'

export type {ComponentDef, OptionStatus}
export {getComponent}

export const COMPONENTS: ComponentDef[] = [
  {
    id: 'c1',
    title: 'C1 Perspective bar',
    defaultOption: 'a',
    cover:
      'How an editor reaches document state and variants from the top right of any Studio, and how the composed address (the perspective bar) opens and closes. Option A: one control (version pill); with a dimension set, the label shows or hides the row, and the version menu has one row that adds a dimension. Option B: two controls, document state and Variants, with one panel. Both share the row and the picker.',
    scope: 'Open beta',
    pick: 'Fork picked on 19 Oct: A one control, B two controls with a mega panel',
    built: true,
    options: [
      {
        id: 'a',
        label: 'One control',
        summary:
          'Today\'s version pill; its menu gains one row ("Add a dimension…" on GA, "View as…" in open beta), which opens the composed-address row; the pending chip reads "Pick a dimension".',
        status: 'candidate',
        refs: 'Figma C1 192:3135; capability matrix 197:4316; edge states 192:3143',
      },
      {
        id: 'b',
        label: 'Two controls',
        summary:
          "The stock state control (Drafts, Published or a release; its menu unchanged) and ONE added Variants control: one flat list for the one dimension with a Default row; applied, it shows one value and a cross. No row, no bar. The router's variant param is the only copy of the choice. The plain pair, kept as it was (no grouping, no cube). One dimension only: on GA use A.",
        status: 'candidate',
        refs: 'Figma C1 Option B section 192:3139 (handoff C1 page)',
      },
      {
        id: 'd',
        label: 'Grouped section',
        summary:
          'The same two controls, grouped in ONE grey section that is the global perspective: an outline cube leads it (not a button), then the state control and the Variants control as white chips. The base says the state (Drafts yellow, Published green, a release neutral). The state control is ONE button: click anywhere on it and its menu opens (no link to the Releases tool inside it), the same logic as the Variants control. Selected for open beta (Open beta (locked) uses it).',
        status: 'candidate',
        refs: 'Figma C1 section 555:3897 (states), 541:1818',
      },
      {
        id: 'e',
        label: 'Grouped section, split state control',
        summary:
          'The grouped section of D, with the state control as it ships: the state icon and label open the Releases tool (tooltip "View scheduling"), the chevron opens the menu. Kept to compare with D: two things side by side with different behaviours.',
        status: 'exploration',
      },
      {
        id: 'c',
        label: 'Shipped bar',
        summary:
          'The perspective bar the shipped Variants feature draws under the navbar (Version and Variant filters), kept as an option for comparison.',
        status: 'exploration',
      },
    ],
  },
  {
    id: 'c2',
    title: 'C2 Document pills',
    defaultOption: 'a',
    cover:
      'Draft and Published in the document header, plus a Versions button that opens the inventory pane. Releases move to their own dropdown.',
    scope: 'Open beta',
    pick: 'Lean: Draft/Published plus Versions button; toggle still open. The Figma drafts of 19 Oct (A grouped dropdowns) refine this; option B is the 20 Oct redraw: a Published | Draft toggle and one Other versions button. The cover text is the older lean.',
    built: true,
    where: 'Open a document: a V1 row under the pane header.',
    options: [
      {
        id: 'a',
        label: 'Grouped dropdowns',
        summary:
          'Follows PR #39: Variants first, a divider, then Published, Draft and Releases; full-radius pills; each of Variants and Releases folds into one dropdown.',
        status: 'candidate',
        refs: 'Figma C2 227:1925; PARTS-C2 (DocumentPerspectiveList)',
      },
      {
        id: 'b',
        label: 'Published toggle',
        summary:
          'The header shows only a Published | Draft toggle (a raised thumb under the chosen side) and one "Other versions · N" button. The button opens a short popover: variants with what each has, releases with dates, and "Open the version inventory…". A variant that is the current view shows as a removable chip beside the toggle; the x returns to the base document.',
        status: 'candidate',
        refs: 'Figma C2 page, option B frames B1, B1b, B2, B3 (file C1T4EUScc9PMf5tqNo09Qs)',
      },
      {
        id: 'c',
        label: 'Collapsed state pill and Versions (open beta, locked)',
        summary:
          'The header shows the state control collapsed to one rounded pill (the layer: Drafts, Published or a release) and a "N Versions" pill that opens the inventory panel (C4 A); the footer\'s "Manage versions" is hidden. Clicking the state pill opens a row "Local perspective" under the header (the layer, the variant, Follow global perspective) while the header pill steps aside; when the pane then differs from global the row collapses and the header says "Local" before the pill. A pane that follows global says nothing.',
        oneLiner: 'One state pill, a Versions pill, a local row on demand.',
        status: 'candidate',
        refs: 'Figma C2 · Document pills, section Document header · selected for open beta: H1 521:42816, H2 521:42925, H3 521:43097',
      },
    ],
  },
  {
    id: 'c3',
    title: 'C3 Document list overlay',
    defaultOption: 'a',
    cover:
      'Icon button on list rows that have versions. Hover opens a popover (full list when few versions; first 5 and "See all N in inventory" when many). Click opens the pane with the document loaded.',
    scope: 'Open beta',
    pick: 'Picked on the 16 Oct call; v1 read-only popover, v2 flyout decided with engineering on 19 Oct. 20 Oct call: ONE indicator, reactive to the perspective (all options). Base perspective: one published or draft icon per document, the draft over the published one, none for a document only in a release. A perspective chosen: the dots go and a diamond marks only the documents with a variant that matches. Option D groups the list instead. Figma C3 page, Document list indicator: L1 base 341:481, L2 perspective 341:890, L3 sorted 341:1305, L4 option D 341:1720',
    built: true,
    options: [
      {
        id: 'a',
        label: 'v1 read-only popover',
        summary:
          'A 25px versions control on every row; hover or focus opens a read-only 400px popover (nothing clickable inside); click opens the base document and the inventory.',
        status: 'candidate',
        refs: 'Figma C3 54:5163; list item types 54:8711',
      },
      {
        id: 'b',
        label: 'v2 flyout menu',
        summary:
          'Clickable rows in a flyout that stays open while the pointer travels to it (needs a hover-intent surface).',
        status: 'candidate',
        refs: 'Figma C3 165:15923',
      },
      {
        id: 'c',
        label: 'Dot as control',
        summary: 'No icon; the dot opens the popover.',
        status: 'exploration',
      },
      {
        id: 'd',
        label: 'Grouped list',
        summary:
          'With a perspective active the list is in two sections, "Has variant" and "No variant for this perspective" (the second collapses), or with the matching documents first (Look > List when a perspective is active). The rows carry no diamond: the section says it. The control on the row is the same as A; the tooltip stays the near-term overlay and there is no double click.',
        status: 'candidate',
        refs: 'Figma C3 page, section Document list indicator: L4 option D grouped 341:1720 (L3 sorted 341:1305)',
      },
    ],
  },
  {
    id: 'c4',
    title: 'C4 Inventory pane',
    defaultOption: 'a',
    cover:
      "Andrej's version inventory panel in the document inspector: views by publish date, stage and priority, sort, filters, saved views. Selecting a row must not swap or shift the toolbar. Expand opens the C5 document lens.",
    scope: 'Open beta',
    pick: "Andrej's panel is A; B is the same panel as a popover; the shared C5 lens at mini width (previous A) is archived. 20 Oct call: the Priority view is out of open beta (World > Priority view, default Hide), replaced by one action, 'What will my visitors see?' (our own component beside the panel: full match, partial match with a prompt, no match with a Create CTA, the draft beneath the published version); the delete dialog says 'If you delete this, X will be served instead'. Figma C4 page, section Editor lens: E1 full match with the draft beneath 345:313, E2 partial match 345:733, E3 no match 345:1040, E4 by stage with release tags 345:1309 (not built: needs the panel's own model), E5 delete dialog 345:1717",
    built: true,
    where:
      'Open a document, then the inspector "Versions" (Option A) or "Manage versions" (Option B).',
    options: [
      {
        id: 'a',
        label: "Andrej's side panel",
        summary:
          "Andrej's inventory side panel (Storybook PR #47, branch explorations/inventory-sidepanel) as the document inspector, on the document's real versions: views By publish date, By stage and By priority, sort, filters, saved views. Expand opens the C5 document lens in a dialog.",
        status: 'candidate',
        story:
          'explorations-variants-2-0-c4-version-inventory-option-a-side-panel--interactive-demo',
      },
      {
        id: 'b',
        label: 'The same panel as a popover',
        summary:
          'The same inventory panel, opened as a popover from a Manage versions button under the pane header.',
        status: 'candidate',
        story:
          'explorations-variants-2-0-c4-version-inventory-option-b-popover--popover-with-views',
      },
      {
        id: 'c',
        label: 'Shared C5 lens at mini width (previous A)',
        summary:
          'The C5 document lens at mini width in the document inspector (grouped by publish date, sort and filter in the command lane, row menu with Publish, Unpublish and Delete, Expand). Archived: kept so old presets and links still resolve.',
        status: 'archived',
        story: 'explorations-variants-2-0-c4-version-inventory-option-a--mini',
      },
    ],
  },
  {
    id: 'c5',
    title: 'C5 Inventory table',
    defaultOption: 'a',
    cover:
      'One table in four lenses: document, definition, dimension, resolution. Document lens in scope; the others are parked.',
    scope: 'Document lens: open beta. Others: parked',
    pick: 'Concept; the spec frame is on this page',
    where: 'Design slots tool.',
    frames: ['c5.flow'],
    options: [
      {
        id: 'a',
        label: 'One surface, a View by switch',
        summary:
          'One table with a View by switch (Document, Definition, Dimension, Visitor) and a pin picker. The Definition lens lists grey rows for documents that miss the version; selected rows get a bulk bar (Create versions, Add to release); Delete opens a dialog that names the version, the documents and who is affected.',
        status: 'candidate',
        refs: 'Spec frame in Figma E5',
        diagramKey: 'c5.a.document',
        frames: ['c5.a.definition', 'c5.a.selection', 'c5.a.delete'],
      },
      {
        id: 'b',
        label: 'Lenses at their pins',
        summary:
          'The same table at the place each lens lives: Definition in the variant detail (with the absent block), Document as a mini lens in the document inspector, Dimension as the overview. Visitor is not drawn in this option.',
        status: 'candidate',
        diagramKey: 'c5.b.homes',
      },
      {
        id: 'c',
        label: 'Not drawn',
        summary: 'A third option, if one is drawn.',
        status: 'exploration',
      },
    ],
  },
  {
    id: 'c6',
    title: 'C6 Variants tool',
    defaultOption: 'a',
    cover:
      'Definitions list, definition detail, documents table, create and edit dialogs. As shipped today.',
    scope: 'Open beta (as shipped)',
    pick: 'No change; table stakes',
    where: 'Design slots tool.',
    frames: ['c6.flow'],
    options: [
      {
        id: 'a',
        label: 'As today',
        summary:
          'The shipped Variants tool (overview with document counts, search and filters; detail with conditions, details and the documents table) plus a proposed block of pages without the version, with Create versions and Add to release.',
        status: 'candidate',
        refs: 'Figma E6',
        diagramKey: 'c6.overview',
        frames: ['c6.detail'],
      },
      {
        id: 'b',
        label: 'Not drawn',
        summary: 'A second option, if one is drawn.',
        status: 'exploration',
      },
      {
        id: 'c',
        label: 'Not drawn',
        summary: 'A third option, if one is drawn.',
        status: 'exploration',
      },
    ],
  },
  {
    id: 'c7',
    title: 'C7 Banners',
    defaultOption: 'a',
    cover:
      'The banner (or its absence) on a document that has no version for the variant the studio shows, in Drafts, Published and a release, with progress and not-found. Option A: an explicit banner with Create variant, always. Option B: always live in Drafts, with a header hint; banner only for Published and releases.',
    scope: 'Open beta',
    pick: 'Fork drawn 19 Oct',
    built: true,
    where: 'Open a document with a variant chosen in the row: a V1 banner at the top of the pane.',
    options: [
      {
        id: 'a',
        label: 'Explicit banner',
        summary:
          'An explicit banner on a document with no version for the shown variant: "Create variant".',
        status: 'candidate',
        refs: 'Figma C7 225:437',
      },
      {
        id: 'b',
        label: 'Always live in Drafts',
        summary:
          'In Drafts no banner, a header hint says the first edit creates the variant; banners for Published and releases.',
        status: 'candidate',
        refs: 'Figma C7 225:441',
      },
      {
        id: 'c',
        label: 'Not drawn',
        summary: 'A third option, if one is drawn.',
        status: 'exploration',
      },
    ],
  },
  {
    id: 'c8',
    title: 'C8 Releases view',
    defaultOption: 'a',
    cover: 'Releases table aligned with the variants table. Polish only.',
    scope: 'Fast follow',
    pick: 'Polish only',
    where: 'Design slots tool.',
    frames: ['c8.flow'],
    options: [
      {
        id: 'a',
        label: 'Table, polished',
        summary:
          'The Releases tool with version columns: the overview adds a Variants count next to documents; the release detail shows the version each document carries and an On publish column (Publishes German, Publishes base).',
        status: 'candidate',
        refs: 'Figma E8',
        diagramKey: 'c8.overview',
        frames: ['c8.detail'],
      },
      {
        id: 'b',
        label: 'Not drawn',
        summary: 'A second option, if one is drawn.',
        status: 'exploration',
      },
      {
        id: 'c',
        label: 'Not drawn',
        summary: 'A third option, if one is drawn.',
        status: 'exploration',
      },
    ],
  },
  {
    id: 'c9',
    title: 'C9 Field marks',
    defaultOption: 'a',
    cover:
      'The gutter mark that says a field differs from the base variant. The shipped mark (a purple rhombus per field, divergence first, read only) stays; B and C are candidates drawn through the public form overrides.',
    scope: 'Open beta',
    pick: 'Portable text field-level for beta; block-level is a candidate',
    where: 'The document form of a variant (try the Field marks test document).',
    options: [
      {
        id: 'a',
        label: 'Field-level (shipped)',
        summary:
          'One rhombus on the field, also for portable text and arrays; array items and removed items carry nothing.',
        status: 'final',
      },
      {
        id: 'b',
        label: 'Block-level portable text',
        summary:
          'The same rhombus at the left edge of each changed portable text block, compared by _key. Candidate.',
        status: 'exploration',
      },
      {
        id: 'c',
        label: 'Block-level + removed items',
        summary:
          'B, plus a note under an array field that counts base items missing from the variant. Candidate.',
        status: 'exploration',
      },
    ],
  },
]

// One line per option for the cards (from the Figma frames, 19 Oct).
const ONE_LINERS: Record<string, Record<string, string>> = {
  c1: {
    a: 'The version pill with a label that shows or hides the row; the menu adds a dimension.',
    b: 'A state pill plus a Variants control that opens one panel.',
    c: 'The shipped bar: Version and Variant filters under the navbar.',
  },
  c2: {
    a: 'Variants first, a divider, then Published, Draft and Releases (as in PR #39).',
    b: 'A Published | Draft toggle and one Other versions button; a variant in view is a chip.',
  },
  c3: {
    a: 'Icon on every row; hover opens a read-only popover; click opens document and inventory.',
    b: 'The same icon with a flyout menu of versions.',
    c: 'Exploration: the status dot is the control.',
    d: 'The list in two sections when a perspective is active: Has variant, No variant.',
  },
  c4: {
    a: "Andrej's panel in the inspector: views by publish date, stage and priority; sort, filters, saved views; Expand.",
    b: 'The same panel, as a popover from Manage versions.',
    c: 'Archived: the shared C5 lens at mini width (the previous A).',
  },
  c5: {
    a: 'One surface with a View by switch, a pin picker, a bulk bar and a delete dialog.',
    b: 'The same table at its homes: variant detail, document inspector, overview.',
  },
  c6: {
    a: 'The shipped Variants tool, plus a block of pages without the version, Create and Add to release.',
  },
  c7: {
    a: 'A banner on a missing variant, with Create variant, in every version.',
    b: 'No banner in Drafts; a hint in the pane header. Banner only in Published and releases.',
  },
  c8: {a: 'The Releases tool with a Variants count, a version column and an On publish column.'},
  c9: {
    a: 'One mark on the field, for every kind; nothing on array items or removed items.',
    b: 'A mark at the left edge of each changed portable text block.',
    c: 'Block marks, and a note counting base items missing from the variant.',
  },
}

// The E9 switches (options/e9.ts) come after C1 to C9.
COMPONENTS.push(
  ...E9_COMPONENTS,
  LOCAL_MATCH,
  ROW_WIDTH,
  NAV_LAYOUT,
  PANE_CONTROL,
  REVIEW_SET,
  LOCALIZATION,
  MARK_SELECTED,
  INSPECTOR_SWITCHER,
)

// Diagram data on the 200 x 100 grid: the part that changes.
const rows = [24, 38, 52, 66, 80]
const DIAGRAMS: Record<string, Record<string, DiagramSpec>> = {
  c1: {
    a: {
      shapes: [
        {kind: 'pill', x: 160, y: 3, w: 26},
        {kind: 'box', x: 1, y: 13, w: 198, h: 8},
      ],
    },
    b: {
      shapes: [
        {kind: 'pill', x: 140, y: 3, w: 16},
        {kind: 'pill', x: 160, y: 3, w: 16},
        {kind: 'box', x: 100, y: 14, w: 92, h: 42},
      ],
    },
    c: {
      shapes: [
        {kind: 'pill', x: 70, y: 14, w: 26, h: 7},
        {kind: 'pill', x: 100, y: 14, w: 26, h: 7},
      ],
    },
  },
  c2: {
    a: {shapes: [60, 88, 116, 144].map((x) => ({kind: 'pill' as const, x, y: 14.5, w: 24, h: 7}))},
    b: {
      shapes: [
        {kind: 'pill', x: 60, y: 14.5, w: 34, h: 7},
        {kind: 'pill', x: 98, y: 14.5, w: 40, h: 7},
      ],
    },
  },
  c3: {
    a: {
      shapes: [
        ...rows.map((y) => ({kind: 'box' as const, x: 40, y: y + 0.5, w: 7, h: 7})),
        {kind: 'box', x: 30, y: 34, w: 42, h: 22},
      ],
    },
    b: {
      shapes: [
        ...rows.map((y) => ({kind: 'box' as const, x: 40, y: y + 0.5, w: 7, h: 7})),
        {kind: 'box', x: 30, y: 34, w: 34, h: 26},
        {kind: 'box', x: 66, y: 34, w: 30, h: 20},
      ],
    },
    c: {shapes: rows.map((y) => ({kind: 'dot' as const, x: 44, y: y + 4}))},
    d: {
      shapes: [
        {kind: 'box', x: 30, y: 14, w: 60, h: 6},
        ...[24, 36].map((y) => ({kind: 'box' as const, x: 36, y, w: 54, h: 8})),
        {kind: 'box', x: 30, y: 52, w: 60, h: 6},
        ...[62, 74].map((y) => ({kind: 'box' as const, x: 36, y, w: 54, h: 8})),
      ],
    },
  },
  c4: {
    a: {frame: 'inspector', shapes: [{kind: 'box', x: 144, y: 12.5, w: 55, h: 87}]},
    b: {shapes: [{kind: 'box', x: 96, y: 26, w: 64, h: 50}]},
    c: {
      frame: 'inspector',
      shapes: [24, 36, 48].map((y) => ({kind: 'box' as const, x: 148, y, w: 47, h: 6})),
    },
  },
  c5: {
    a: {shapes: [{kind: 'box', x: 56, y: 28, w: 140, h: 62}]},
    b: {
      shapes: [
        {kind: 'box', x: 56, y: 28, w: 88, h: 62},
        {kind: 'box', x: 148, y: 28, w: 48, h: 62},
      ],
    },
  },
  c6: {a: {shapes: [{kind: 'box', x: 56, y: 28, w: 140, h: 62}]}},
  c7: {
    a: {shapes: [{kind: 'box', x: 53, y: 25, w: 143, h: 10}]},
    b: {shapes: [{kind: 'box', x: 130, y: 14.5, w: 60, h: 5}]},
  },
  c8: {a: {shapes: [{kind: 'box', x: 56, y: 28, w: 140, h: 62}]}},
  c9: {
    a: {
      shapes: [
        {kind: 'dot', x: 58, y: 38},
        {kind: 'dot', x: 58, y: 52},
        {kind: 'dot', x: 58, y: 66},
      ],
    },
    b: {
      shapes: [
        {kind: 'dot', x: 58, y: 38},
        {kind: 'dot', x: 58, y: 52},
        {kind: 'box', x: 59, y: 62, w: 3, h: 12},
      ],
    },
    c: {
      shapes: [
        {kind: 'dot', x: 58, y: 38},
        {kind: 'box', x: 59, y: 50, w: 3, h: 12},
        {kind: 'box', x: 64, y: 78, w: 80, h: 8},
      ],
    },
  },
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
  c5: {a: 'explorations-variants-2-0-c5-inventory-table-option-a--document-full'},
  c6: {a: 'explorations-variants-2-0-c6-variants-tool-option-a--definition-detail'},
  c7: {
    a: 'explorations-variants-2-0-c7-banners-option-a--drafts-no-variant',
    b: 'explorations-variants-2-0-c7-banners-option-b--drafts-live',
  },
  c8: {a: 'explorations-variants-2-0-c8-releases-view-option-a--autumn'},
  c9: {
    a: 'explorations-variants-2-0-field-marks-by-kind--marks-by-field-kind',
    b: 'explorations-variants-2-0-field-marks-portable-text--portable-text-treatments',
    c: 'explorations-variants-2-0-field-marks-removed-and-new-items--removed-and-new-items',
  },
}

for (const component of COMPONENTS) {
  for (const option of component.options) {
    // C1 to C4 and C7 are drawn in the generic frame form of the shared spec (options/diagrams.json).
    const generic = `${component.id}.${option.id}`
    if (!option.diagramKey && (diagrams as unknown as DiagramFile).diagrams[generic])
      option.diagramKey = generic
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
    {label: 'Studio chrome', ids: ['c1', 'c2', 'c3', 'navLayout', 'rowWidth']},
    {label: 'Inventory', ids: ['c4', 'c5', 'c6']},
    {label: 'Document', ids: ['c7', 'c9', 'inspectorSwitcher']},
    {label: 'Releases', ids: ['c8']},
    E9_GROUP,
    LOCALIZATION_GROUP,
    ICONOGRAPHY_GROUP,
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
      {value: 3, label: '3', title: 'Three columns'},
      {value: 4, label: '4', title: 'Four columns'},
      {value: 5, label: '5', title: 'Five and more: the rail and definitions'},
    ],
  },
  presets,
  defaultPreset: 'open-beta-locked',
  // The global pill shape (docs/initiatives/curation-perspective-selector/SHAPE-TOKEN.md): Round = shipped, Box = 3px.
  shape: {variable: '--v2-pill-radius', round: '999px', box: '3px'},
  diagrams: diagrams as unknown as DiagramFile,
  links: {
    figmaFile: 'https://www.figma.com/design/C1T4EUScc9PMf5tqNo09Qs',
    remote: '/static/options-remote.html',
    journeysRemote: '/static/remote.html',
    // The branch alias follows the newest deployment of explorations/variants-2-0. SANITY_STUDIO_STORYBOOK_BASE overrides it
    // (for example http://localhost:6006). Both hosted URLs sit behind a sign-in.
    storybookBase:
      process.env.SANITY_STUDIO_STORYBOOK_BASE ??
      'https://sanity-studio-storybook-git-explorations-variants-2-0.sanity.dev',
  },
})
