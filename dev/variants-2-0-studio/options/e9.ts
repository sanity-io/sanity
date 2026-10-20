// The E9 switches (local perspective, compare, review, list, field marks). Brief: docs/initiatives/curation-perspective-selector/DESIGN-STUDIO-BRIEF-E9.md.
// Each one is `independent`: "Show" (All A, All B) does not move it, so every existing preset keeps today's look. A = today (shipped),
// B = the smaller step, C = the fuller step. The names are fixed so Storybook can carry the same globals.
import {type ComponentDef} from '../design-options/types'

const FIGMA = 'Figma file C1T4EUScc9PMf5tqNo09Qs, page E9 413:2'

export const E9_COMPONENTS: ComponentDef[] = [
  {
    id: 'paneAddress',
    tag: 'PA',
    title: 'Pane address',
    defaultOption: 'a',
    independent: true,
    built: true,
    scope: 'Open beta',
    cover:
      'How a document pane tells which version it shows. One rule: a pane names its address only when it differs from the global perspective. Vocabulary: global perspective (the Showing row), local perspective (one pane).',
    pick: 'Decided 20 Oct: "differs" tag, "Follow global perspective" button, Documents icon with a count. A local perspective holds when the global one changes. Open: L5a or L5b (hidden switch localMatch).',
    where: 'The document pane header of a document that has versions.',
    options: [
      {
        id: 'a',
        label: 'Chips (today)',
        summary: 'The C2 pills and chips in the pane header, as shipped.',
        oneLiner: 'The pane header chips, as shipped.',
        status: 'final',
      },
      {
        id: 'b',
        label: 'Documents · N only',
        summary:
          'A Documents button with a count opens the inventory. The pane has no address of its own: it always follows the global perspective.',
        oneLiner: 'A Documents · N button; panes always follow global.',
        status: 'candidate',
        refs: `${FIGMA}; whole-screen anatomy E2 408:3570`,
      },
      {
        id: 'c',
        label: 'Documents · N + local row',
        summary:
          'B, plus a local perspective row under the header when a pane differs from the global perspective: a "differs" tag, the address, and "Follow global perspective" at the row end. At the 350 px floor the tag is the menu.',
        oneLiner: 'B plus a local row that says "differs" and offers "Follow global perspective".',
        status: 'candidate',
        refs: `${FIGMA}; states L0 to L6 on 413:5`,
      },
    ],
  },
  {
    id: 'compare',
    tag: 'CP',
    title: 'Compare',
    defaultOption: 'a',
    independent: true,
    built: true,
    scope: 'Open beta',
    cover:
      'Seeing one document at two addresses. One differing dimension only. The title says what differs (D12): Comparing variants, Seeing what changed since Published, Comparing translations.',
    pick: 'In the open beta exploration. A comparison ends when the Against pane closes; it does not survive navigating to another document (open question 2).',
    where: 'The "Open beside" row action in the inventory and the list flyout.',
    options: [
      {
        id: 'a',
        label: 'None',
        summary: 'No compare surface.',
        oneLiner: 'No compare.',
        status: 'final',
      },
      {
        id: 'b',
        label: 'Open beside',
        summary:
          'Opens the same document at another address as a second pane that shows its own local row (E2).',
        oneLiner: 'A second pane at another address.',
        status: 'candidate',
        refs: `${FIGMA}; E2 417:85095`,
      },
      {
        id: 'c',
        label: 'Compare header',
        summary:
          'B, plus one header across both panes: the title by what differs, Showing and Against, "N changes in M fields", Copy link, Close comparison, and the change list rail. A comparison across two dimensions is refused with the way back.',
        oneLiner: 'B plus one compare header and a change list.',
        status: 'candidate',
        refs: `${FIGMA}; compare 413:6: C1 417:9525, C2 418:22855, C3 418:24112, C4 418:88753, C5 418:89904, C6 418:25272`,
      },
    ],
  },
  {
    id: 'reviewPanel',
    tag: 'RP',
    title: 'Review changes panel',
    defaultOption: 'a',
    independent: true,
    built: true,
    scope: 'Open beta',
    cover:
      'The Review changes panel: what changed in this document against another version, and undoing one change.',
    pick: 'Open: what "Revert all" reverts (drawn: what the panel lists).',
    where: 'The pane menu, Review changes.',
    options: [
      {
        id: 'a',
        label: 'Shipped panel',
        summary: 'The Review changes panel as shipped.',
        oneLiner: 'The shipped panel.',
        status: 'final',
      },
      {
        id: 'b',
        label: 'Showing / Against',
        summary:
          'Showing and Against rows, a counterpart picker limited to one-move options (the rest disabled with "Open beta compares one dimension at a time"), the total and filters, Revert per change with Undo.',
        oneLiner: 'Showing and Against rows, one-move picker, Revert with Undo.',
        status: 'candidate',
        refs: `${FIGMA}; R1 418:86973, R2 419:32232, R3 420:2`,
      },
      {
        id: 'c',
        label: 'Follows the pane',
        summary:
          'B, plus: the panel belongs to the pane it opened from (R4), the selected card thickens its field mark (a two-way link), and "Open full view" leads into the compare.',
        oneLiner: 'B plus a panel that follows its pane and links to the field.',
        status: 'candidate',
        refs: `${FIGMA}; R4 420:84306`,
      },
    ],
  },
  {
    id: 'listMark',
    tag: 'LM',
    title: 'List mark',
    defaultOption: 'a',
    independent: true,
    built: true,
    scope: 'Open beta',
    cover:
      'The "has variant" mark on the grouped document list (C3 option D, with a perspective chosen).',
    pick: 'Faheem: option D needs one shared mark; maybe the whole side purple.',
    where: 'The document list with C3 on option D and a variant perspective chosen.',
    options: [
      {
        id: 'a',
        label: 'Row icon (today)',
        summary: 'The row icon of the shipped list.',
        oneLiner: "Today's row icon.",
        status: 'final',
      },
      {
        id: 'b',
        label: 'Purple diamond',
        summary: 'One purple variant diamond on the "Has variant" stack.',
        oneLiner: 'A purple diamond on the "Has variant" stack.',
        status: 'candidate',
        refs: `${FIGMA}; D′1a 415:27448`,
      },
      {
        id: 'c',
        label: 'Purple side rule',
        summary: 'A purple side rule and a light purple tint on the whole "Has variant" side.',
        oneLiner: 'A purple side rule and tint.',
        status: 'candidate',
        refs: `${FIGMA}; D′1b 416:2`,
      },
    ],
  },
  {
    id: 'listFlyout',
    tag: 'LF',
    title: 'List flyout',
    defaultOption: 'a',
    independent: true,
    built: true,
    scope: 'Open beta',
    cover:
      "Reaching a document's versions from the list row, and opening one beside the current document.",
    pick: 'Option E: a row flyout of versions; Cmd-click opens beside the current document as its base. No tabs yet.',
    where: 'A row of the document list.',
    options: [
      {id: 'a', label: 'None', summary: 'No flyout.', oneLiner: 'No flyout.', status: 'final'},
      {
        id: 'b',
        label: 'Chevron flyout',
        summary: 'A chevron on the row opens a flyout with the versions and "Open beside".',
        oneLiner: 'A chevron flyout with versions and Open beside.',
        status: 'candidate',
        refs: `${FIGMA}; E1 417:6978`,
      },
      {
        id: 'c',
        label: 'Chevron + Cmd-click',
        summary: 'B, plus Cmd-click anywhere on a row opens the document beside the current one.',
        oneLiner: 'B plus Cmd-click opens beside.',
        status: 'candidate',
        refs: `${FIGMA}; E2 417:85095, E3 418:2`,
      },
    ],
  },
  {
    id: 'reviewPass',
    tag: 'RV',
    title: 'Review pass',
    defaultOption: 'a',
    independent: true,
    built: true,
    scope: 'Open beta',
    cover:
      'Reviewing many documents for one variant: which differ from the base, and a walk through them.',
    pick: 'Open: whether "Looked at" persists across sessions (session only for now).',
    where: 'The document list header, with a variant perspective chosen.',
    options: [
      {
        id: 'a',
        label: 'None',
        summary: 'No review pass.',
        oneLiner: 'No review pass.',
        status: 'final',
      },
      {
        id: 'b',
        label: 'Differs word + header',
        summary:
          'A "Differs" word on each row and a header count, "Returning visitors against Base · 7 of 10 differ", with "Review Returning visitors".',
        oneLiner: 'A Differs word per row and a header count.',
        status: 'candidate',
        refs: `${FIGMA}; M1 423:6`,
      },
      {
        id: 'c',
        label: 'Pass held in the list',
        summary:
          'B, plus the pass is held in the list pane: "Document 3 of 7 that differ", "Next changed document", "End review", Esc, and "Looked at" as reader state.',
        oneLiner: 'B plus a pass held in the list pane.',
        status: 'candidate',
        refs: `${FIGMA}; M2 424:3144 (M3 release 424:31172 and M4 Changed since 425:24630 not built)`,
      },
    ],
  },
  {
    id: 'fieldMarks',
    tag: 'FM',
    title: 'Field marks (E9)',
    defaultOption: 'a',
    independent: true,
    built: true,
    scope: 'Open beta',
    cover:
      'The marks in the form gutters. Left gutter: which version (the diamond). Right gutter: what changed (a bar with the word Changed). Changed is purple; added green and removed red only. Extends C9.',
    pick: 'F2-D (roll-up and arbitration) as the base layer, F2-C (peek) on top. See E9-AUDIT.md for why A falls short.',
    where: 'The form of a variant: Field marks test 2 (Returning visitors).',
    options: [
      {
        id: 'a',
        label: 'Shipped',
        summary: 'The shipped marks (see C9 A and the audit).',
        oneLiner: 'The shipped marks.',
        status: 'final',
      },
      {
        id: 'b',
        label: 'Complete marks',
        summary:
          'A purple right-gutter bar with the word "Changed"; a roll-up count on collapsed containers, fieldsets and array items ("3 changed inside"); block marks; removed-item notes; an unknown-path mark; one mark per field with the priority changed, then diverged, then differs from base.',
        oneLiner: 'Purple "Changed" bar, roll-up counts, block, removed and unknown marks.',
        status: 'candidate',
        refs: 'F2-inline-changes.md (F2-D)',
      },
      {
        id: 'c',
        label: 'Complete marks + peek',
        summary:
          'B, plus a peek: focus or press on the mark opens a reveal with before and after, the author, and "Open comparison".',
        oneLiner: 'B plus a peek with before and after.',
        status: 'candidate',
        refs: 'F2-inline-changes.md (F2-C)',
      },
    ],
  },
]

/**
 * The address row's content width on wide screens. RECOMMENDATION (not decided): B, contained at 1200 px, because the row's content is a
 * sentence (Showing, chips, actions) that stops being readable when it spans a 2560 px screen; the row's line still runs edge to edge.
 */
export const ROW_WIDTH: ComponentDef = {
  id: 'rowWidth',
  tag: 'RW',
  title: 'Address row width',
  defaultOption: 'b',
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'How wide the content of the address row (the Showing row under the navbar) may grow. On a very wide screen it stretched to both corners.',
  pick: 'Default B is a recommendation, not a decision.',
  where: 'Any page with the Showing row open.',
  options: [
    {
      id: 'a',
      label: 'Full',
      summary: 'Edge to edge, as before.',
      oneLiner: 'Edge to edge.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Contained · 1200',
      summary:
        'Content up to 1200 px wide, centred; the row keeps its line edge to edge. Recommended.',
      oneLiner: 'Up to 1200 px, centred. Recommended.',
      status: 'candidate',
    },
    {
      id: 'c',
      label: 'Compact · 880',
      summary: 'Content up to 880 px wide, centred.',
      oneLiner: 'Up to 880 px, centred.',
      status: 'candidate',
    },
  ],
}

/** Hidden switch (not in the window): L5a keeps the local row with "matches global" when the global perspective catches up (b); L5b follows quietly (a, default). URL: localMatch.b */
export const LOCAL_MATCH: ComponentDef = {
  id: 'localMatch',
  tag: 'LM2',
  title: 'Local matches global (L5a / L5b)',
  defaultOption: 'a',
  independent: true,
  built: true,
  options: [
    {
      id: 'a',
      label: 'L5b: follow quietly',
      summary: 'The row goes away when the global perspective matches the pane.',
      status: 'candidate',
    },
    {
      id: 'b',
      label: 'L5a: keep the row',
      summary: 'The row stays and says "matches global".',
      status: 'candidate',
    },
  ],
}

/**
 * Where the tools and the global perspective sit in the navbar (Figma E9 3c: N1 439:12761, N3 440:2, N2 440:1529). A is today, B moves the
 * tools to the left after the workspace and search and Create to the right (the address row stays under the navbar), C is B plus the whole
 * global perspective in the navbar, with no row under it. The row layout and the row width do nothing in C (there is no row).
 */
export const NAV_LAYOUT: ComponentDef = {
  id: 'navLayout',
  tag: 'NV',
  title: 'Navbar layout',
  defaultOption: 'a',
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'Where the tools and the global perspective sit in the navbar. Row layout and Row width are not used with C: there is no row under the navbar.',
  pick: 'Faheem asked to flip between the three live. C is the vision frame (E9 3c), not decided.',
  where: 'The navbar, on every page.',
  options: [
    {
      id: 'a',
      label: 'Today',
      summary: 'The shipped navbar: tools centred, the address row under it.',
      oneLiner: 'Tools centred, row under the navbar.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Tools left',
      summary:
        'Tools left after the workspace; search and Create on the right, before tasks and the account. The address row stays under the navbar.',
      oneLiner: 'Tools left; search and Create right.',
      status: 'candidate',
      refs: `${FIGMA}; 3c N1 439:12761`,
    },
    {
      id: 'c',
      label: 'Tools left, address in the bar',
      summary:
        "B, plus the whole global perspective (bundle chip, dimension chips) in the navbar, left of search. The row under the navbar is removed; a chip's close removes it.",
      oneLiner: 'B plus the perspective inside the navbar.',
      status: 'candidate',
      refs: `${FIGMA}; 3c N3 440:2, N2 440:1529`,
    },
  ],
}

export const E9_GROUP = {label: 'Compare and review (E9)', ids: E9_COMPONENTS.map((c) => c.id)}
