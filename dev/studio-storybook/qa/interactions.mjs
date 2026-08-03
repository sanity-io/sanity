/**
 * Interaction specs for `qa/interact.mjs`.
 *
 * One entry per story that has behaviour worth driving. A story that only renders needs no spec:
 * the render gate covers it. A story whose whole point is that you can OPEN or TYPE into it
 * belongs here, because mounting proves nothing about it.
 *
 * Spec shape:
 *   {
 *     id:       story id (as in the Storybook index) - or a DOCS id, see viewMode below
 *     name:     label for the report (optional)
 *     viewMode: 'docs' - drive the component's docs page instead of the story page (default:
 *               'story'). `id` becomes the docs entry and `heading` (required) names the
 *               embedded story to act on, by its exact display name.
 *     heading:  the embedded story's display name, only used when viewMode is 'docs'
 *     viewport: {width, height}  - override the 1280x900 default
 *     settle:   ms to wait after load
 *     steps:    [{click|type|press|waitFor, settle?, timeout?, note?}]
 *     expect:   [selector | {text} | {selector, countAtLeast}]
 *   }
 *
 * After EVERY step the gate asserts: no pageerror, no visible error overlay, and no floating
 * layer overflowing the viewport (the crop check).
 */

// @sanity/ui menus/popovers land in a portal Layer; these are the stable hooks.
const MENU = '[data-ui="Menu"]'
const POPOVER = '[data-ui="Popover"]'
const DIALOG = '[role="dialog"]' // eslint-disable-line no-unused-vars -- used by search specs below

export const specs = [
  // ---------------------------------------------------------------- navbar & shell
  {
    id: 'navbar-shell-presence-menu--default',
    name: 'PresenceMenu opens without throwing',
    steps: [{click: '#storybook-root button', note: 'open the presence menu'}],
    expect: [MENU],
  },
  {
    id: 'navbar-shell-user-menu--default',
    name: 'UserMenu opens fully on screen',
    steps: [{click: '#storybook-root button'}],
    expect: [MENU],
  },
  {
    id: 'navbar-shell-new-document-button--default',
    name: 'NewDocumentButton opens its type list fully on screen',
    steps: [{click: '#storybook-root button'}],
    expect: [POPOVER],
  },
  {
    id: 'navbar-shell-presence-menu--empty-room',
    name: 'PresenceMenu empty room opens',
    steps: [{click: '#storybook-root button'}],
    expect: [MENU],
  },
  {
    id: 'navbar-shell-presence-menu--cannot-invite',
    name: 'PresenceMenu without invite permission opens',
    steps: [{click: '#storybook-root button'}],
    expect: [MENU],
  },
  {
    // This story renders the menu itself rather than a trigger, so there is nothing to open:
    // assert the three scheme choices are really there and that picking one does not throw.
    id: 'navbar-shell-nav-drawer-menus--appearance',
    name: 'Appearance menu offers all three schemes',
    steps: [{click: 'text=Light'}],
    expect: [{text: 'System'}, {text: 'Dark'}, {text: 'Light'}],
  },
  {
    id: 'navbar-shell-search-button--in-context',
    name: 'SearchButton opens real search and finds a document',
    settle: 3500,
    steps: [
      {click: '#storybook-root button', note: 'open the popover'},
      {type: {selector: 'input', text: 'pricing'}, settle: 1800, note: 'run a real query'},
    ],
    expect: [{text: 'pricing'}],
  },
  {
    // The Stubbed lane's one interaction. Five of the six RequestAccess states are decided by
    // the GET and so arrive already rendered; the rate limit is a property of the account
    // ACROSS projects, so nothing in this project's history predicts it and only submitting
    // reveals it. Without this spec that branch is unreachable and the page would quietly
    // document five of six.
    id: 'navbar-shell-screens-request-access--rate-limited',
    name: 'RequestAccess surfaces the 429 cross-project limit on submit',
    // NOT `text=Request access`. That is a case-insensitive SUBSTRING match, and `.first()`
    // would land on the paragraph "You can request access below with an optional note", which
    // precedes the button in the DOM. Clicking prose does nothing and the expect below would
    // fail for a reason that has nothing to do with the component.
    steps: [
      {
        click: 'button:has-text("Request access")',
        settle: 800,
        note: 'submit; the stub rejects 429',
      },
    ],
    expect: [{text: 'reached the limit for access requests'}],
  },

  // ---------------------------------------------------------------- search
  // The whole point of these: a search box that renders is not a search box that searches.
  // Each spec types a real query and asserts on a document that genuinely matches the fixtures.
  {
    id: 'search-search-popover--default',
    name: 'Popover: typing a query returns real hits',
    settle: 3500,
    steps: [{type: {selector: 'input', text: 'release'}, settle: 2000}],
    expect: [{text: 'Announcing the summer release'}],
  },
  {
    id: 'search-search-popover--with-results',
    name: 'Popover: seeded results are present',
    settle: 4000,
    steps: [],
    alsoTight: false,
    expect: [{text: 'Announcing the summer release'}, {text: 'Best match'}],
  },
  {
    id: 'search-search-popover--no-results',
    name: 'Popover: a non-matching query says so',
    settle: 4000,
    steps: [],
    alsoTight: false,
    expect: [{text: 'No results found'}],
  },
  {
    id: 'search-search-popover--request-failed',
    name: 'Popover: a failed request surfaces an error',
    settle: 4000,
    steps: [],
    alsoTight: false,
    expect: [{text: 'Something went wrong'}],
  },
  {
    id: 'search-search-dialog--instructions',
    name: 'Dialog: the instructions state is reachable',
    settle: 4000,
    steps: [],
    alsoTight: false,
    viewport: {width: 700, height: 800},
    expect: [{text: 'refine your search'}],
  },
  {
    id: 'search-filter-inputs-string--string-empty',
    name: 'String filter input emits what is typed',
    settle: 3000,
    steps: [{type: {selector: 'input', text: 'pricing'}, settle: 600}],
    expect: [{text: '"pricing"'}],
  },
  {
    id: 'search-filter-inputs-string--string-list',
    name: 'String list offers the schema options',
    settle: 3000,
    steps: [{click: '#storybook-root button', settle: 900}],
    expect: [{text: 'In review'}, {text: 'Archived'}],
  },
  {
    id: 'search-filter-inputs-reference-and-asset--image-preview',
    name: 'Image preview actually resolves its pixels',
    settle: 4500,
    steps: [],
    alsoTight: false,
    // A preview stuck on its loading overlay looks identical to a slow one. Assert the <img> is
    // genuinely decoded rather than that the component mounted.
    expect: [{selector: 'img', countAtLeast: 1}],
  },

  // Nested popovers INSIDE the search surfaces. These are the specs that would have caught the
  // boundary-element bug: Add filter and the document-type menu both mounted a Popover that
  // rendered `display: none` because the boundary had no height, so the buttons were completely
  // dead while every render-level check stayed green.
  {
    id: 'search-search-popover--with-results',
    name: 'Popover: Add filter opens the schema-derived field list',
    settle: 4000,
    steps: [{click: 'text=Add filter', settle: 1200}],
    expect: [{text: 'All fields'}, {text: 'Reading time'}],
  },
  {
    id: 'search-search-popover--with-results',
    name: 'Popover: the document-type menu opens',
    settle: 4000,
    steps: [{click: 'text=All types', settle: 1200}],
    expect: [{text: 'Article'}, {text: 'Author'}],
  },
  {
    id: 'search-search-dialog--with-results',
    name: 'Dialog: Add filter opens the field list',
    settle: 4000,
    viewport: {width: 900, height: 820},
    alsoTight: false,
    steps: [{click: 'text=Add filter', settle: 1200}],
    expect: [{text: 'All fields'}],
  },
  {
    id: 'search-filter-shell--filters-applied',
    name: 'Filter bar with filters applied is quiet, not auto-opened',
    settle: 3500,
    steps: [],
    alsoTight: false,
    expect: [{text: 'Clear filters'}],
  },

  // ---------------------------------------------------------------- Table (CORE primitive)
  // The Table is virtualized, so "it rendered" is a much weaker claim than usual: a wrong
  // scroll container gives you a header, an empty tbody, and no error at all. These specs
  // assert rows actually exist, and that the two interactive affordances do something.
  {
    id: 'lists-data-table--populated',
    name: 'Table: virtualized rows are actually in the DOM',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{selector: '[data-testid="table-row"]', countAtLeast: 5}],
  },
  {
    id: 'lists-data-table--sortable',
    name: 'Table: a string column sorts on header click',
    settle: 3000,
    alsoTight: false,
    steps: [{click: 'button:has-text("Author")', settle: 800}],
    expect: [{selector: '[data-testid="table-row"]', countAtLeast: 5}],
  },
  {
    id: 'lists-data-table--searchable',
    name: 'Table: the search header filters rows',
    settle: 3000,
    alsoTight: false,
    steps: [{type: {selector: 'input[placeholder="Search books"]', text: 'lem'}, settle: 900}],
    expect: [{text: 'Solaris'}, {text: 'The Cyberiad'}],
  },
  {
    id: 'lists-data-table--loading',
    name: 'Table: loading renders skeleton rows, not an empty body',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{selector: '[data-testid="table-row-skeleton"]', countAtLeast: 3}],
  },
  {
    // Guards ledger #52 from BOTH directions. If the Recommended story ever stops sorting, the
    // workaround has regressed; if the Current story ever starts sorting, the upstream bug has
    // been fixed and this pair should be retired rather than left claiming a defect that is gone.
    id: 'lists-data-table--recommended',
    name: 'Table: a numeric column sorts once given a sortTransform (ledger #52)',
    settle: 3000,
    alsoTight: false,
    steps: [{click: 'button:has-text("Year")', settle: 900}],
    // Not just "rows exist": after a descending sort by year the 1974 book must be row 0.
    // A weaker assertion would pass against the very no-op this pair exists to document.
    expect: [{selector: '[data-index="0"]:has-text("The Dispossessed")', countAtLeast: 1}],
  },

  // ---------------------------------------------------------------- Releases
  // The two disabled branches are the point of this component, and a render gate cannot tell
  // a disabled row from an enabled one. Both are reached through seeded harness state
  // (workspace release limit / the ReleasePermissions resource-cache seam), so if either seam
  // breaks these stories silently fall back to the enabled row and only this notices.
  {
    id: 'releases-create-release-menu-item--limit-reached',
    name: 'CreateReleaseMenuItem is disabled at the workspace release limit',
    settle: 3500,
    alsoTight: false,
    steps: [],
    expect: [{selector: '[data-testid="create-new-release-button"][disabled]', countAtLeast: 1}],
  },
  {
    id: 'releases-create-release-menu-item--no-permission',
    name: 'CreateReleaseMenuItem is disabled without release permission',
    settle: 3500,
    alsoTight: false,
    steps: [],
    expect: [{selector: '[data-testid="create-new-release-button"][disabled]', countAtLeast: 1}],
  },
  {
    id: 'releases-create-release-menu-item--enabled',
    name: 'CreateReleaseMenuItem is live when permitted and under the limit',
    settle: 3500,
    alsoTight: false,
    steps: [],
    expect: [
      {selector: '[data-testid="create-new-release-button"]:not([disabled])', countAtLeast: 1},
    ],
  },
  {
    // The 2.5s collapse is a timed transition, so a gate that samples once sees whichever side
    // of it the timing lands on. Settle well past it and assert the collapsed form, which is
    // what an editor is actually left looking at.
    id: 'releases-validation-progress-indicator--all-valid',
    name: 'ValidationProgressIndicator collapses to a bare checkmark after 2.5s',
    settle: 4500,
    alsoTight: false,
    steps: [],
    expect: [{selector: '[data-sanity-icon="checkmark-circle"]', countAtLeast: 1}],
  },
  {
    // Ledger #53, pinned on BOTH sides of the timer.
    // Sampled early (1.2s), the error sentence must be on screen. Do not raise this settle:
    // past 2.5s the text is gone, and a gate that only sampled late would quietly certify the
    // defect as correct behaviour.
    id: 'releases-validation-progress-indicator--has-errors',
    name: 'ValidationProgressIndicator states the error before the timer hides it (ledger #53)',
    settle: 1200,
    alsoTight: false,
    steps: [],
    expect: [{text: 'issues found'}],
  },
  {
    // The other side: after the collapse the critical GLYPH must survive even though the
    // sentence does not. If this ever goes green-checkmark, the tone guard has broken and the
    // badge would be claiming a failing release is fine.
    id: 'releases-validation-progress-indicator--has-errors',
    name: 'ValidationProgressIndicator keeps its critical glyph after collapsing (ledger #53)',
    settle: 4500,
    alsoTight: false,
    steps: [],
    expect: [{selector: '[data-sanity-icon="error-outline"]', countAtLeast: 1}],
  },

  // ---------------------------------------------------------------- Perspective
  // The closed pill was already storied elsewhere; nothing ever opened the dropdown, which is
  // where all the behaviour is. These three assert that it opens AND that its contents differ by
  // configuration - the three states are indistinguishable while closed, so a render gate can
  // never tell them apart and a story that only mounts them proves nothing.
  {
    id: 'navbar-shell-perspective-releases-nav--drafts',
    name: 'Perspective menu opens with the release sections',
    settle: 3000,
    alsoTight: false,
    steps: [{click: '[data-testid="global-perspective-menu-button"]', settle: 1200}],
    expect: [{text: 'Hotfix launch'}, {text: 'Spring campaign'}, {text: 'Someday ideas'}],
  },
  {
    id: 'navbar-shell-perspective-releases-nav--releases-disabled',
    name: 'Perspective menu offers only the system perspectives when releases are off',
    settle: 3000,
    alsoTight: false,
    steps: [{click: '[data-testid="global-perspective-menu-button"]', settle: 1200}],
    // Published and Drafts are present; the release CTAs must NOT be.
    expect: [
      {text: 'Published'},
      {text: 'Drafts'},
      {selector: '[data-testid="release-menu"]:not(:has-text("New release"))', countAtLeast: 1},
    ],
  },
  {
    id: 'navbar-shell-perspective-releases-nav--no-releases-yet',
    name: 'Perspective menu offers the create CTA when releases are on but empty',
    settle: 3000,
    alsoTight: false,
    steps: [{click: '[data-testid="global-perspective-menu-button"]', settle: 1200}],
    expect: [{text: 'New release'}, {text: 'View Content Releases'}],
  },
  {
    id: 'navbar-shell-perspective-releases-nav--in-a-release',
    name: 'Perspective pill names the selected release',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{text: 'active Release'}],
  },

  // ---------------------------------------------------------------- Structure state panes
  {
    // A pane mounted without `PaneLayout` throws; a pane mounted in a zero-height container
    // renders collapsed and empty. Both look like "nothing here" and neither is a page error,
    // so assert the pane chrome and its content are genuinely present.
    id: 'document-pane-state-panes--side-by-side',
    name: 'Three state panes coexist in one pane chain',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [
      {selector: '[data-testid="pane"]', countAtLeast: 3},
      {text: 'Unknown pane type'},
      {text: 'Blog posts'},
    ],
  },
  {
    // The two UnknownPane branches produce different copy, which is the whole point of there
    // being two of them. A render gate cannot tell them apart.
    id: 'document-pane-state-panes--unknown-missing-type',
    name: 'UnknownPane distinguishes a missing type from an unhandled one',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Unknown pane type'}],
  },

  // ---------------------------------------------------------------- Structure errors
  {
    // StructureError decides PER ERROR whether a stack helps. The SerializeError branch must
    // show the structure path and a docs link; if the branch logic breaks it silently falls
    // through to the stack view, which still renders and still looks fine.
    id: 'document-pane-structure-errors--serialize-error-story',
    name: 'StructureError shows a path and a help link for a builder error',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [
      {text: 'Structure path'},
      {selector: 'a[href*="sanity.io/docs/help/"]', countAtLeast: 1},
    ],
  },
  {
    id: 'document-pane-structure-errors--build-error',
    name: 'StructureError suppresses the stack for a build failure',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Module build failed'}],
  },

  // ---------------------------------------------------------------- Collab parts
  {
    // The elision is computed, not styled: it must render a literal `...` standing in for the
    // folded middle segments while keeping the first and last. CSS truncation would pass a
    // render gate and be a different component.
    id: 'collaboration-comment-parts--breadcrumbs-elided',
    name: 'CommentBreadcrumbs folds the middle, keeping first and last',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Article'}, {text: '...'}, {text: 'Heading'}],
  },
  {
    id: 'collaboration-comment-parts--reactions',
    name: 'CommentReactionsBar groups reactions with counts',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: '2'}, {selector: '[data-ui="Flex"]', countAtLeast: 1}],
  },
  {
    // Same dialog, same layout, different copy. The whole value of `isParent` is that these two
    // do not say the same thing, so assert the thread wording specifically.
    id: 'collaboration-comment-parts--delete-thread',
    name: 'CommentDeleteDialog says THREAD when deleting a parent comment',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Delete this comment thread?'}],
  },
  {
    id: 'collaboration-comment-parts--delete-comment',
    name: 'CommentDeleteDialog says COMMENT when deleting a reply',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Delete this comment?'}],
  },

  // ---------------------------------------------------------------- Task fields
  {
    id: 'collaboration-task-fields--status',
    name: 'StatusSelector emits a set patch on the chosen status',
    settle: 2500,
    alsoTight: false,
    steps: [
      {click: '#storybook-root button:visible', settle: 800},
      {click: '[data-ui="Menu"] [role="menuitem"]:has-text("Done")', settle: 700},
    ],
    expect: [{text: `set("closed", ['status'])`}],
  },
  {
    // Ledger #56, pinned. Clearing the field emits `unset([])` AND `set("")`, the second
    // overwriting the first. If the missing `return` is ever added upstream, this expectation
    // fails and the story stops claiming a bug that is gone.
    id: 'collaboration-task-fields--title-filled',
    name: 'Title clearing emits unset then set("") - the fall-through bug (ledger #56)',
    settle: 2500,
    alsoTight: false,
    steps: [
      {click: 'textarea', settle: 300},
      {press: 'ControlOrMeta+a'},
      {press: 'Backspace', settle: 700},
    ],
    expect: [{text: 'unset([])'}, {text: 'set("")'}],
  },

  // ---------------------------------------------------------------- Releases overview parts
  // Three of these components return null from conditions their props do not mention. A render
  // gate cannot distinguish "rendered nothing on purpose" from "failed to render", so the null
  // cases are pinned by asserting the FRAME text is there and the banner text is not.
  {
    id: 'releases-overview-parts--drafts-disabled',
    name: 'DraftsDisabledBanner names drafts mode vs scheduled drafts',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{selector: '[data-ui="Card"][data-tone="caution"]', countAtLeast: 2}],
  },
  {
    // The banner must be ABSENT here. Asserting the frame label proves the story mounted, so an
    // empty result is a decision rather than a failure to render.
    id: 'releases-overview-parts--drafts-disabled-hidden',
    name: 'DraftsDisabledBanner renders nothing without a scheduled draft',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{text: 'the banner rendered nothing'}],
  },
  {
    id: 'releases-overview-parts--view-picker-both',
    name: 'CardinalityViewPicker switches view from its menu',
    settle: 3000,
    alsoTight: false,
    steps: [
      {click: '#storybook-root button', settle: 800},
      {click: '[data-ui="Menu"] [role="menuitem"]:has-text("Scheduled drafts")', settle: 700},
    ],
    expect: [{text: 'Scheduled drafts'}],
  },

  // ---------------------------------------------------------------- InsertMenu
  // The auto-filter threshold is the design. Both sides of it are asserted, because a component
  // that always showed the filter (or never did) would pass a render gate identically.
  {
    id: 'forms-input-insertmenu--auto-filter',
    name: 'InsertMenu shows a filter past five types, and it filters',
    settle: 2500,
    alsoTight: false,
    steps: [{type: {selector: '#storybook-root input', text: 'co'}, settle: 700}],
    expect: [{text: 'Code block'}],
  },
  {
    id: 'forms-input-insertmenu--default',
    name: 'InsertMenu shows NO filter under five types',
    settle: 2500,
    alsoTight: false,
    steps: [],
    // The three type labels are present and there is no text input to be seen.
    expect: [{text: 'Image'}, {selector: '#storybook-root:not(:has(input))', countAtLeast: 1}],
  },
  {
    id: 'forms-input-insertmenu--no-results',
    name: 'InsertMenu says so when nothing matches',
    settle: 2500,
    alsoTight: false,
    steps: [{type: {selector: '#storybook-root input', text: 'zzz'}, settle: 700}],
    expect: [{text: 'No results'}],
  },

  // ---------------------------------------------------------------- docs-mode popovers
  // The class of defect the render gate cannot see and the story-mode interaction gate above
  // cannot see either: these three popovers open cleanly at viewMode=story, but the docs page
  // stacks every story into its own fixed-height inline canvas, and a popover that opens
  // downward can portal outside that canvas or get clipped by it. `viewMode: 'docs'` runs the
  // spec against the component's docs entry instead, scoped to the named story's own section.
  // A settle of 3000ms after the click is deliberate: the failure mode on the broken tree is not
  // an immediate crop, the popover resolves to its (wrong) final size over a couple of seconds, so
  // a short settle would let the crop probe run before the defect has fully manifested.
  //
  // `.docs-story` is CSS-capped at 60vh (measured: 540px at the default 900px viewport, 252px at
  // the tight 900x420 one - both exactly 60% of viewport height), so the tight-canvas run is not
  // redundant here the way it might look: it exercises a genuinely smaller, stricter cap, not the
  // same cap at a smaller browser window. Confirmed the tight run passes clean on
  // storybook-candidate before leaving `alsoTight` at its default (on) rather than opting out.
  {
    id: 'forms-input-array-functions--docs',
    name: 'docs: ArrayOfObjectsFunctions insert menu opens inside its own canvas',
    viewMode: 'docs',
    heading: 'Enabled, two candidate types - ArrayOfObjectsFunctions (menu open)',
    steps: [{click: 'button:has-text("Add item")', settle: 3000}],
    expect: ['input[placeholder="Search"]'],
  },
  {
    id: 'forms-input-array-functions--docs',
    name: 'docs: ArrayOfPrimitivesFunctions insert menu opens inside its own canvas',
    viewMode: 'docs',
    heading: 'Enabled, two candidate types - ArrayOfPrimitivesFunctions (menu open)',
    steps: [{click: 'button:has-text("Add item")', settle: 3000}],
    expect: [{text: 'Number'}],
  },
  {
    // No data-testid on this trigger (see the story's own docblock), and it is the only
    // interactive element in its section, so the first button is unambiguous.
    id: 'forms-input-array-members--docs',
    name: 'docs: IncompatibleItemType popover opens without clipping',
    viewMode: 'docs',
    heading: 'IncompatibleItemType (leaf, note the drifted duplicate)',
    steps: [{click: 'button', settle: 3000}],
    expect: [{text: 'Why is this happening?'}],
  },

  // ---------------------------------------------------------------- Events timeline
  {
    id: 'document-status-events-timeline--default',
    name: 'EventsTimeline lists real events',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{selector: '#storybook-root [data-ui]', countAtLeast: 3}],
  },
  {
    // Selection drives what the whole document pane shows, so it must be more than a hover style.
    id: 'document-status-events-timeline--with-selection',
    name: 'EventsTimeline selection moves on click',
    settle: 3000,
    alsoTight: false,
    steps: [{click: '#storybook-root button', settle: 700}],
    expect: [{selector: '#storybook-root [data-ui]', countAtLeast: 3}],
  },

  // ---------------------------------------------------------------- Version chips
  {
    // The chip row is where a document reveals it has more than one simultaneous truth.
    // Assert the chips exist AND that clicking one moves the selection readout.
    id: 'releases-version-chips--selecting',
    name: 'VersionChip switches the edited version',
    settle: 3000,
    alsoTight: false,
    steps: [{click: '#storybook-root button:has-text("Published")', settle: 700}],
    expect: [{text: 'editing: published'}],
  },
  {
    id: 'releases-version-chips--states',
    name: 'VersionChip renders all four states without throwing',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Autumn campaign'}, {text: 'Locked release'}, {text: 'Unavailable'}],
  },

  // ---------------------------------------------------------------- Release CTAs
  {
    // The validation gate is the whole point: a release with an invalid document must not be
    // publishable, and a render gate cannot tell a disabled button from an enabled one.
    id: 'releases-cta-buttons--publish-all-blocked',
    name: 'Publish all is disabled when a document fails validation',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{selector: '#storybook-root button[disabled]', countAtLeast: 1}],
  },
  {
    id: 'releases-cta-buttons--publish-all',
    name: 'Publish all is live when every document is valid',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{selector: '#storybook-root button:not([disabled])', countAtLeast: 1}],
  },

  // ---------------------------------------------------------------- Structure dialogs
  {
    // The reference list is the argument of this component. If the previews ever stop resolving
    // the dialog silently degrades to a count, which is the version that cannot be acted on.
    id: 'document-pane-structure-dialogs--delete-with-references',
    name: 'ConfirmDeleteDialogBody lists the referring documents, not just a count',
    settle: 3500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Home'}, {text: 'Pricing'}, {text: 'Main navigation'}],
  },
  {
    // Note the safe case does NOT name the document - it asks a generic question. Asserting the
    // title here fails, which is how that asymmetry was found.
    id: 'document-pane-structure-dialogs--delete-no-references',
    name: 'ConfirmDeleteDialogBody stays quiet when nothing references the document',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{text: 'Are you sure you want to delete'}],
  },

  // ---------------------------------------------------------------- Pane-driven banners
  // These banners' main job is DECIDING whether to exist, so the negative cases carry more
  // weight than the positive ones. A gate that only asserted the visible states would pass
  // against a banner that had started rendering unconditionally.
  {
    id: 'document-banners-pane-driven--revision-not-found',
    name: 'RevisionNotFoundBanner appears when the revision is missing',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: "We couldn't find the document revision selected"}],
  },
  {
    id: 'document-banners-pane-driven--revision-found',
    name: 'RevisionNotFoundBanner stays silent when the revision resolves',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'the banner rendered nothing'}],
  },
  {
    id: 'document-banners-pane-driven--deprecated-type',
    name: "DeprecatedDocumentTypeBanner carries the schema author's own reason",
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'has been deprecated'}, {text: 'Use "post" instead'}],
  },
  {
    // The guard that matters: silent DURING the delete, speaks once it lands. A banner that
    // announced a delete still in flight would be claiming something that can still fail.
    id: 'document-banners-pane-driven--deleting',
    name: 'DeletedDocumentBanners stays silent while the delete is in flight',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'deliberately stays silent'}],
  },
  {
    id: 'document-banners-pane-driven--deleted',
    name: 'DeletedDocumentBanners speaks once the delete has landed',
    settle: 2500,
    alsoTight: false,
    steps: [],
    expect: [{text: 'This document has been deleted'}],
  },
  {
    // Not "never published" - this fires when the CURRENT release will unpublish the document.
    id: 'document-banners-pane-driven--unpublished',
    name: 'UnpublishedDocumentBanner warns that a release will unpublish this document',
    settle: 3000,
    alsoTight: false,
    steps: [],
    expect: [{text: 'will be unpublished as part of'}],
  },
]
