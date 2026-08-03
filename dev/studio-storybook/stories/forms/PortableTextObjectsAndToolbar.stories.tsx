import {
  type ArraySchemaType,
  type ObjectSchemaType,
  type PortableTextBlock,
  type PortableTextObject,
  type SchemaType,
  type SchemaTypeDefinition,
  type User,
} from '@sanity/types'
import {Box, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'

import {SelectedAnnotationsProvider} from '../../../../packages/sanity/src/core/form/inputs/PortableText/contexts/SelectedAnnotationsContext'
// Real components, real paths (org contract §8). None of these are re-exported from the
// `sanity` package's public entry point, so they are reached the same way
// `PortableTextEditModals.stories.tsx` reaches its own object/modals siblings: a direct
// relative import into source, not through `sanity`'s exports map.
import {DefaultAnnotationComponent} from '../../../../packages/sanity/src/core/form/inputs/PortableText/object/Annotation'
import {DefaultBlockObjectComponent} from '../../../../packages/sanity/src/core/form/inputs/PortableText/object/BlockObject'
import {BlockObjectActionsMenu} from '../../../../packages/sanity/src/core/form/inputs/PortableText/object/BlockObjectActionsMenu'
import {DefaultInlineObjectComponent} from '../../../../packages/sanity/src/core/form/inputs/PortableText/object/InlineObject'
import {UserPresenceCursor} from '../../../../packages/sanity/src/core/form/inputs/PortableText/presence-cursors/UserPresenceCursor'
import {CustomIcon} from '../../../../packages/sanity/src/core/form/inputs/PortableText/toolbar/CustomIcon'
import {
  type BlockAnnotationProps,
  type BlockProps,
} from '../../../../packages/sanity/src/core/form/types/blockProps'
import {
  type RenderArrayOfObjectsItemCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../../packages/sanity/src/core/form/types/renderCallback'
import {NamedPortalFrame} from '../../lib/documentGroupInventoryFrame'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Schema shared by every real-editor story on this page: a `post` document whose `body`
 * holds a default `block` (default styles/lists/decorators, plus the default `link`
 * annotation Sanity ships when a block type sets no `marks.annotations` override), an
 * inline `mention`, and a block-level `callout`. `bareNote` is a second document type
 * whose block strips every optional group (`styles` down to one, empty `lists`, empty
 * `marks.decorators`/`marks.annotations`, empty inline `of`) - the fixture for the one
 * Toolbar story on this page.
 */
const schemaTypes: SchemaTypeDefinition[] = [
  {
    name: 'mention',
    title: 'Mention',
    type: 'object',
    fields: [{name: 'userName', title: 'User name', type: 'string'}],
    preview: {select: {title: 'userName'}},
  },
  {
    name: 'callout',
    title: 'Callout',
    type: 'object',
    fields: [
      {name: 'heading', title: 'Heading', type: 'string'},
      {name: 'note', title: 'Note', type: 'text'},
    ],
    preview: {select: {title: 'heading', subtitle: 'note'}},
  },
  {
    name: 'post',
    title: 'Post',
    type: 'document',
    fields: [
      {
        name: 'body',
        title: 'Body',
        type: 'array',
        of: [{type: 'block', of: [{type: 'mention'}]}, {type: 'callout'}],
      },
    ],
  },
  {
    name: 'bareNote',
    title: 'Bare note',
    type: 'document',
    fields: [
      {
        name: 'body',
        title: 'Body',
        type: 'array',
        of: [
          {
            type: 'block',
            styles: [{title: 'Normal', value: 'normal'}],
            lists: [],
            marks: {decorators: [], annotations: []},
            of: [],
          },
        ],
      },
    ],
  },
]

// ============================================================================
// Fixtures: Portable Text bodies for the real-editor stories.
// ============================================================================

const annotationLinkKey = 'linkA'
const annotationBlockKey = 'annBlk'
const annotationBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: annotationBlockKey,
    style: 'normal',
    markDefs: [{_key: annotationLinkKey, _type: 'link', href: 'https://www.sanity.io'}],
    children: [
      {_type: 'span', _key: 'annS0', text: 'Read the docs at ', marks: []},
      {_type: 'span', _key: 'annS1', text: 'sanity.io', marks: [annotationLinkKey]},
      {_type: 'span', _key: 'annS2', text: ' for the full model.', marks: []},
    ],
  },
]

const populatedBlockKey = 'popBlk'
const populatedBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: populatedBlockKey,
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'popS0', text: 'Format, list and annotate this line.', marks: []},
    ],
  },
]

const emptyBlockKey = 'emptyBlk'
const emptyBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: emptyBlockKey,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 'emptyS0', text: '', marks: []}],
  },
]

const bareBlockKey = 'bareBlk'
const bareBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: bareBlockKey,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 'bareS0', text: 'Nothing applicable here.', marks: []}],
  },
]

const richBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'richBlk',
    style: 'normal',
    markDefs: [{_key: annotationLinkKey, _type: 'link', href: 'https://www.sanity.io'}],
    children: [
      {_type: 'span', _key: 'r0', text: 'Reviewed with ', marks: []},
      {_type: 'mention', _key: 'mentionIC', userName: 'Ada Lovelace'},
      {_type: 'span', _key: 'r1', text: ', docs linked at ', marks: []},
      {_type: 'span', _key: 'r2', text: 'sanity.io', marks: [annotationLinkKey]},
      {_type: 'span', _key: 'r3', text: '.', marks: []},
    ],
  },
  {
    _type: 'callout',
    _key: 'calloutIC',
    heading: 'Ship structured content',
    note: 'Objects render through their schema preview.',
  },
]

// ============================================================================
// Play-function helpers. The harness suspends while the mock workspace compiles, so plays
// poll for their trigger before acting (same discipline as PortableTextInput.stories.tsx).
// ============================================================================

function waitForElement(root: HTMLElement, selector: string, timeout = 8000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const poll = () => {
      const element = root.querySelector<HTMLElement>(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - startedAt > timeout) {
        reject(new Error(`Timed out waiting for ${selector}`))
      } else {
        setTimeout(poll, 100)
      }
    }
    poll()
  })
}

async function placeCaretInEditor(root: HTMLElement): Promise<void> {
  const editable = await waitForElement(root, '[data-testid="pt-editor"] [contenteditable="true"]')
  editable.focus()
  const textNode = editable.querySelector('[data-text]')?.firstChild ?? editable.firstChild
  if (textNode) {
    window.getSelection()?.setBaseAndExtent(textNode, 0, textNode, 0)
  }
}

/** Mirrors `AnnotationLink`'s play function in PortableTextInput.stories.tsx exactly. */
async function selectLinkAnnotation(canvasElement: HTMLElement): Promise<void> {
  const link = await waitForElement(canvasElement, 'span[data-link]')
  const textNode = link.querySelector('[data-text]')?.firstChild ?? link.firstChild
  if (textNode) {
    link.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
    window.getSelection()?.setBaseAndExtent(textNode, 1, textNode, 1)
    link.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}))
  }
}

async function openActionMenu(canvasElement: HTMLElement): Promise<void> {
  await placeCaretInEditor(canvasElement)
  const trigger = await waitForElement(
    canvasElement,
    '[data-testid="action-menu-button"]:not([disabled])',
  )
  trigger.click()
}

async function openBlockActionsMenu(canvasElement: HTMLElement): Promise<void> {
  const trigger = await waitForElement(canvasElement, 'button[aria-label="Open menu"]')
  trigger.click()
}

/**
 * Polls for a `[data-ui="MenuItem"]` whose text matches, anywhere in the document - the menu
 * portals to the named target `NamedPortalFrame` supplies, outside `canvasElement`. Confirms
 * not just that something with `data-ui="Menu"` exists, but that the SPECIFIC item the docblock
 * promises is actually there.
 */
function waitForMenuItemText(doc: Document, text: string, timeout = 8000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const poll = () => {
      const match = Array.from(doc.querySelectorAll<HTMLElement>('[data-ui="MenuItem"]')).find(
        (el) => el.textContent?.trim() === text,
      )
      if (match) {
        resolve(match)
      } else if (Date.now() - startedAt > timeout) {
        reject(new Error(`Timed out waiting for a MenuItem with text "${text}"`))
      } else {
        setTimeout(poll, 100)
      }
    }
    poll()
  })
}

async function hoverElement(canvasElement: HTMLElement, testId: string): Promise<void> {
  const el = await waitForElement(canvasElement, `[data-testid="${testId}"]`)
  el.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}))
}

function PostEditor(props: {body?: PortableTextBlock[]; documentType?: string; height?: number}) {
  const {body, documentType = 'post', height = 260} = props
  return (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType={documentType}
        initialDocument={body ? {body} : undefined}
        height={height}
      />
    </Box>
  )
}

const meta: Meta = {
  title: 'Forms & Input/Portable Text Objects and Toolbar',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Two of the three default object renderers escalate their tone on a validation error, ' +
            'and the third computes the identical booleans and stays silent, so a block-level ' +
            'object failing validation looks exactly like a valid one unless someone opens it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/PortableText/{object,toolbar,presence-cursors}/*` |',
          '| Tier | SERVICE. The chrome around the editor `PortableTextInput.stories.tsx` already mounts at full depth: the embedded-object frames (block, inline, annotation), the two actions popovers riding on top of them, the format/insert toolbar, and the presence cursors that show where a collaborator is |',
          '| Counted | `object/` 8 exported pieces (11 counting the three `Default*Component` renderers separately) · `toolbar/` 5 · `presence-cursors/` 1 |',
          '| Findings | 3 |',
          '',
          'Everything a Portable Text block or inline object is *dressed in* once it lands in the ' +
            'editor, plus the toolbar above it and the collaborator cursors beside it. ' +
            '`object/modals/*` (edit dialogs) has its own page, `PortableTextEditModals.stories.tsx`; ' +
            'this page picks up everything else in `object/`, `toolbar/` and `presence-cursors/`.',
          '',
          '> **Why it matters:** `DefaultAnnotationComponent` and `DefaultInlineObjectComponent` ' +
            'both escalate their tone to `critical`/`caution` on a validation error; ' +
            '`DefaultBlockObjectComponent` computes the identical `hasError`/`hasWarning` booleans ' +
            'and only sets a boolean `data-invalid`/`data-warning` attribute, never a tone. A ' +
            'block-level object failing validation looks exactly like a valid one unless you ' +
            'inspect the DOM or open it; the two lighter-weight object kinds do not share this gap.',
          '',
          '### Counted against the brief',
          '',
          '`object/` (excluding `modals/`, already storied) has **8 exported pieces**, not the ~10 ' +
            'estimated: `Annotation`, `BlockObject`, `BlockObjectActionsMenu`, ' +
            '`CombinedAnnotationPopover`, `InlineObject`, `InlineObjectToolbarPopover`, `Plugins` ' +
            '(exports `PortableTextEditorPlugins`), `TablePlugin` (exports ' +
            '`PortableTextTablePlugin`). `helpers.ts` exports one pure function ' +
            '(`_getModalOption`), not a component. Counting the three `Default*Component` exports ' +
            '(`DefaultAnnotationComponent`, `DefaultBlockObjectComponent`, ' +
            '`DefaultInlineObjectComponent`) separately from their dispatchers brings the total to ' +
            '11, which is probably where "about 10" came from.',
          '',
          '`toolbar/` has **5 exported components**, not 4: `Toolbar`, `ActionMenu`, ' +
            '`BlockStyleSelect`, `CustomIcon`, `InsertMenu`. (`helpers.tsx`, `hooks.ts`, ' +
            '`useApplicableSchema.ts`, `types.ts` and `index.ts` are not components.) A same-named ' +
            '`InsertMenu.stories.tsx` already exists in this chapter, but it stories a *different* ' +
            'component, `packages/sanity/src/insert-menu/InsertMenu`, the array-input "Add item" ' +
            'menu, so it does not cover `toolbar/InsertMenu.tsx` at all.',
          '',
          '`presence-cursors/` has exactly **1** exported component, `UserPresenceCursor`; that ' +
            'count matched.',
          '',
          '### What is already covered elsewhere, and skipped here',
          '',
          '`PortableTextInput.stories.tsx` mounts `Annotation` (`AnnotationLink`), `BlockObject` ' +
            '(`BlockObject`, the `Current`/`Recommended` pair), `InlineObject` (`InlineObject`), ' +
            '`Toolbar` (every `PostEditor` render), `BlockStyleSelect` (`BlockStyleMenuOpen`) and ' +
            '`toolbar/InsertMenu` (`InsertMenuOpen`, the deprecation pair) at full depth through ' +
            'the real editor. This page does not repeat those; it covers the pieces that page does ' +
            'not reach on its own: the two actions popovers, the two `Default*Component` renderers ' +
            'as renderers in their own right (not through the dispatcher), `ActionMenu`, ' +
            '`CustomIcon`, presence cursors, and the plugin-registration layer.',
          '',
          '### Findings worth a ledger entry',
          '',
          '<details><summary><b>Toolbar insert races an in-flight async resolve against the live selection.</b></summary>',
          '',
          '`Toolbar.tsx:216-236`: `handleInsertBlock`/`handleInsertInline` ' +
            '`await resolveInitialValue(type)`, which itself can take a visible detour through a ' +
            '"Resolving initial value…" toast past `SLOW_INITIAL_VALUE_LIMIT` (300ms), and only ' +
            "then call `PortableTextEditor.insertBlock`/`insertChild` against the editor's " +
            '*current* selection. Nothing re-checks that the selection (or the mounted state of ' +
            'this toolbar) is still what it was when Insert was clicked; a slow resolver plus a ' +
            'moved caret inserts at the wrong place with no signal that this happened.',
          '',
          '</details>',
          '',
          '<details><summary><b>An unresolvable Portable Text item type is silently dropped, not shown broken.</b></summary>',
          '',
          '`formState.ts:1206-1218` gives an array-of-objects item whose `_type` matches nothing ' +
            'in `of` a `kind: "error"` member (`INVALID_ITEM_TYPE`), distinct from the ' +
            '`INCOMPATIBLE_TYPE` case `PortableTextEditModals.stories.tsx` already covers for ' +
            '`ObjectInputMember`. `hooks/usePortableTextMembers.tsx:71` ' +
            '(`usePortableTextMemberItemsFromProps`) then walks `members` with ' +
            '`if (member.kind !== "item") continue`; an error-kind member never becomes a ' +
            '`PortableTextMemberItem`, so `Annotation`/`BlockObject`/`InlineObject` never resolve ' +
            'a `memberItem` for it. Whether the block still renders at all is decided by ' +
            '`@portabletext/editor`’s own schema-driven block dispatch, outside `packages/sanity` ' +
            'and outside what this page can verify without a build (this session ran without one, ' +
            'per instruction); flagged as open rather than asserting a render not seen.',
          '',
          '</details>',
          '',
          '<details><summary><b>`UserPresenceCursor` has no fallback for a user with no display name.</b></summary>',
          '',
          '`@sanity/types`’ `User.displayName` is optional; ' +
            '`presence-cursors/UserPresenceCursor.tsx:112-164` renders `{user.displayName}` ' +
            'directly with no fallback and derives its own `data-testid` from it ' +
            '(`presence-cursor-${user.displayName?.split(" ").join("-")}`), so a user with no ' +
            'display name hovers to an empty label and a `data-testid="presence-cursor-undefined"`. ' +
            'Upstream, `store/presence/presence-store.ts:233-252` already filters out any session ' +
            'whose user profile *fails to resolve* entirely (`userSessionPairHasUser`), so this is ' +
            'reachable only through a resolved user record that has no name set, not through a ' +
            'broken lookup.',
          '',
          '</details>',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      previewStore: createMockDocumentPreviewStore({documents: []}),
    }),
  ],
  tags: ['autodocs', 'chapter:forms', 'chapter:cms', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

// ============================================================================
// BlockObjectActionsMenu. One return (BlockObjectActionsMenu.tsx:92-151) with three
// conditional MenuItem branches: a reference "Open reference" link, a readOnly-only
// "View", and an edit+remove pair. Standalone: it takes no PortableTextEditor context,
// only the plain props DefaultBlockObjectComponent hands it.
// ============================================================================

const calloutValue = {
  _type: 'callout',
  _key: 'menuCallout',
  heading: 'Ship structured content',
} as unknown as PortableTextBlock
const referenceValue = {
  _type: 'reference',
  _key: 'menuRef',
  _ref: 'doc-123',
} as unknown as PortableTextBlock

/**
 * Not a reference, not read-only: the menu opens on Edit and Remove.
 *
 * CORRECTED DIAGNOSIS. The sweep that flagged this page named `isOpen={false}` /
 * `onOpen={() => undefined}` as the cause - reasonably, they read as "wired to nothing" - but
 * that is not what `isOpen`/`onOpen` do here. Reading `BlockObjectActionsMenu.tsx:24-28,60-62`:
 * `onOpen` fires when "Edit"/"View" is CLICKED (it opens the edit MODAL, a concern the parent
 * owns), and `isOpen` only feeds a `useEffect`/Tab-focus-return check - neither gates whether the
 * DROPDOWN itself opens. `@sanity/ui`'s `MenuButton` manages that on its own; these two stories'
 * play functions never click "Edit", so the no-op props were never exercised and were not the bug.
 *
 * The real cause, confirmed live against the unfixed build (story id block-actions-menu-editable,
 * viewMode=story): clicking the trigger DID flip `aria-expanded` to "true" on the button, but zero
 * Popover nodes ever appeared anywhere in the document - the dropdown's own internal state opened
 * while its content silently failed to mount. `BlockObjectActionsMenu.tsx:33-38` sets the popover's
 * `portal` prop to the plain string 'default', not `true` - see `lib/documentGroupInventoryFrame.tsx`'s
 * own header comment on this exact trap. `@sanity/ui`'s `Portal` resolves a string `portal` prop
 * through the ambient `PortalProvider`'s NAMED elements map, never the unnamed slot `OverlayFrame`
 * sets up. In real Studio, `Compositor.tsx:552-561,582` supplies that named map (a `default` key
 * pointing at the ambient portal element, plus `editor` and `expanded`); `WithStudioProviders`
 * supplies no such thing, so 'default' resolves to nothing and the popover mounts an empty subtree
 * with no error - the exact "silent, no fallback" failure the trap note describes. Fixed with
 * `NamedPortalFrame`, passing 'default' as its `portalElementName`, which registers a live DOM
 * node under that same key.
 */
export const BlockActionsMenuEditable: Story = {
  name: 'BlockObjectActionsMenu - editable (Edit, Remove)',
  render: () => (
    <NamedPortalFrame portalElementName="default">
      <BlockObjectActionsMenu
        focused
        isOpen={false}
        onOpen={() => undefined}
        onRemove={() => undefined}
        value={calloutValue}
      />
    </NamedPortalFrame>
  ),
  play: async ({canvasElement}) => {
    await openBlockActionsMenu(canvasElement)
    await waitForMenuItemText(canvasElement.ownerDocument, 'Edit')
    await waitForMenuItemText(canvasElement.ownerDocument, 'Remove')
  },
}

/**
 * `readOnly`: the edit/remove pair is replaced entirely by a single "View" item.
 *
 * Same fix and the same corrected diagnosis as the editable story above - see its docblock.
 */
export const BlockActionsMenuReadOnly: Story = {
  name: 'BlockObjectActionsMenu - read only (View)',
  render: () => (
    <NamedPortalFrame portalElementName="default">
      <BlockObjectActionsMenu
        focused
        isOpen={false}
        onOpen={() => undefined}
        onRemove={() => undefined}
        readOnly
        value={calloutValue}
      />
    </NamedPortalFrame>
  ),
  play: async ({canvasElement}) => {
    await openBlockActionsMenu(canvasElement)
    await waitForMenuItemText(canvasElement.ownerDocument, 'View')
  },
}

/**
 * `isReference(value)` true: an "Open reference" link item is prepended, edit/remove stay.
 *
 * Same fix and the same corrected diagnosis as the editable story above - see its docblock.
 */
export const BlockActionsMenuReference: Story = {
  name: 'BlockObjectActionsMenu - reference value (Open reference, Edit, Remove)',
  render: () => (
    <NamedPortalFrame portalElementName="default">
      <BlockObjectActionsMenu
        focused
        isOpen={false}
        onOpen={() => undefined}
        onRemove={() => undefined}
        value={referenceValue}
      />
    </NamedPortalFrame>
  ),
  play: async ({canvasElement}) => {
    await openBlockActionsMenu(canvasElement)
    await waitForMenuItemText(canvasElement.ownerDocument, 'Open reference')
    await waitForMenuItemText(canvasElement.ownerDocument, 'Edit')
    await waitForMenuItemText(canvasElement.ownerDocument, 'Remove')
  },
}

// ============================================================================
// DefaultBlockObjectComponent / DefaultInlineObjectComponent / DefaultAnnotationComponent
// as RENDERERS, not through their dispatchers. Per the fixture rule, a renderer's input is
// whatever it is handed: `BlockProps.renderPreview` and `.validation` are exactly that, so
// they are fixture-controlled directly rather than routed through a real preview store or
// a real invalid document. `open` stays `false` and inline's `__unstable_referenceElement`
// stays `null` throughout, because both branches would otherwise mount `ObjectEditModal` /
// `InlineObjectToolbarPopover`, which call `usePortableTextEditor()` unconditionally and
// throw outside a real editor (matching PortableTextEditModals.stories.tsx's own reason for
// mounting its modal chrome only through FormBuilderHarness).
// ============================================================================

const noopRenderField: RenderFieldCallback = () => null
const noopRenderInput: RenderInputCallback = () => null
const noopRenderItem: RenderArrayOfObjectsItemCallback = () => null

const arrayParentType = {name: 'body', jsonType: 'array', of: []} as unknown as ArraySchemaType
const calloutSchemaType = {
  name: 'callout',
  title: 'Callout',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType
const mentionSchemaType = {
  name: 'mention',
  title: 'Mention',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType
const linkSchemaType = {
  name: 'link',
  title: 'Link',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType
const blockParentType = {name: 'block', jsonType: 'object'} as unknown as SchemaType

const previewResolved: RenderPreviewCallback = () => (
  <Stack gap={2} padding={2}>
    <Text size={1} weight="medium">
      Ship structured content
    </Text>
    <Text size={1} muted>
      Objects render through their schema preview.
    </Text>
  </Stack>
)

/** Same muted, same weight as the resolved preview's subtitle: nothing here says "loading". */
const previewLoading: RenderPreviewCallback = () => (
  <Flex align="center" gap={2} padding={2}>
    <Spinner muted />
    <Text size={1} muted>
      Loading preview…
    </Text>
  </Flex>
)

/** Same card, same muted text style as `previewLoading` above: this is the finding. */
const previewUnresolvable: RenderPreviewCallback = () => (
  <Stack gap={2} padding={2}>
    <Text size={1} muted>
      Untitled
    </Text>
  </Stack>
)

function baseBlockProps(overrides: Partial<BlockProps> = {}): BlockProps {
  return {
    __unstable_floatingBoundary: null,
    __unstable_referenceBoundary: null,
    __unstable_referenceElement: null,
    children: null,
    changed: false,
    focused: false,
    // oxlint-disable-next-line no-deprecated -- markers is a required field on the real BlockProps type
    markers: [],
    onClose: () => undefined,
    onOpen: () => undefined,
    onPathFocus: () => undefined,
    onRemove: () => undefined,
    open: false,
    parentSchemaType: arrayParentType,
    path: [],
    presence: [],
    readOnly: false,
    renderDefault: DefaultBlockObjectComponent,
    renderField: noopRenderField,
    renderInput: noopRenderInput,
    renderItem: noopRenderItem,
    renderPreview: previewResolved,
    schemaType: calloutSchemaType,
    selected: false,
    validation: [],
    value: calloutValue,
    ...overrides,
  }
}

function Frame({children}: {children: ReactNode}) {
  return (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      {children}
    </Card>
  )
}

/** Resolved preview, no selection, no validation: the default rest state. */
export const DefaultBlockObjectResolved: Story = {
  name: 'DefaultBlockObjectComponent - resolved preview',
  render: () => (
    <Frame>
      <DefaultBlockObjectComponent {...baseBlockProps()} />
    </Frame>
  ),
}

/** `selected || focused` → tone `primary` (BlockObject.tsx:393). */
export const DefaultBlockObjectSelected: Story = {
  name: 'DefaultBlockObjectComponent - selected (tone primary)',
  render: () => (
    <Frame>
      <DefaultBlockObjectComponent {...baseBlockProps({selected: true})} />
    </Frame>
  ),
}

/**
 * A validation error is present (`hasError` true, BlockObject.tsx:390) but the card's
 * `tone` prop (line 393) never reads it - only `data-invalid` (line 414) does. Visually
 * identical to `DefaultBlockObjectResolved` above; that identity is the finding.
 */
export const DefaultBlockObjectValidationNotEscalated: Story = {
  name: 'DefaultBlockObjectComponent - validation error (no tone change)',
  render: () => (
    <Frame>
      <DefaultBlockObjectComponent
        {...baseBlockProps({
          validation: [{level: 'error', message: 'Heading is required', path: ['heading']}],
        })}
      />
    </Frame>
  ),
}

/** What `renderPreview` returns while a preview is still resolving: the caller's own stand-in. */
export const DefaultBlockObjectPreviewLoading: Story = {
  name: 'DefaultBlockObjectComponent - preview loading (fixture-controlled renderPreview)',
  render: () => (
    <Frame>
      <DefaultBlockObjectComponent {...baseBlockProps({renderPreview: previewLoading})} />
    </Frame>
  ),
}

/**
 * What a removed schema type or a failed preview would leave behind, at the BlockObject
 * layer: the chrome (`Root`, tone, actions menu) is identical either way - it is entirely
 * `renderPreview`'s job to say "loading" vs "broken", and here it says neither.
 */
export const DefaultBlockObjectPreviewUnresolvable: Story = {
  name: 'DefaultBlockObjectComponent - preview unresolvable (indistinguishable from loading)',
  render: () => (
    <Frame>
      <DefaultBlockObjectComponent {...baseBlockProps({renderPreview: previewUnresolvable})} />
    </Frame>
  ),
}

function baseInlineProps(overrides: Partial<BlockProps> = {}): BlockProps {
  return {
    ...baseBlockProps({
      parentSchemaType: blockParentType as unknown as ArraySchemaType,
      schemaType: mentionSchemaType,
      value: {
        _type: 'mention',
        _key: 'inlineMention',
        userName: 'Ada Lovelace',
      } as unknown as PortableTextBlock,
      renderPreview: () => (
        <Text size={1} weight="medium">
          Ada Lovelace
        </Text>
      ),
    }),
    ...overrides,
  }
}

/** Resolved inline preview, no selection, no validation. */
export const DefaultInlineObjectResolved: Story = {
  name: 'DefaultInlineObjectComponent - resolved preview',
  render: () => (
    <Frame>
      <DefaultInlineObjectComponent {...baseInlineProps()} />
    </Frame>
  ),
}

/** `selected || focused` → tone `primary` (InlineObject.tsx:276-279), same rule as the block object. */
export const DefaultInlineObjectSelected: Story = {
  name: 'DefaultInlineObjectComponent - selected (tone primary)',
  render: () => (
    <Frame>
      <DefaultInlineObjectComponent {...baseInlineProps({selected: true})} />
    </Frame>
  ),
}

/**
 * Unlike the block object above, `InlineObject.tsx:267-280` puts `hasError`/`hasWarning`
 * *ahead of* `selected`/`focused` in its own tone ladder, so a validation error here does
 * escalate to tone `critical` - the object-level inconsistency the page docblock opens with.
 */
export const DefaultInlineObjectValidationEscalates: Story = {
  name: 'DefaultInlineObjectComponent - validation error (tone critical, unlike BlockObject)',
  render: () => (
    <Frame>
      <DefaultInlineObjectComponent
        {...baseInlineProps({
          validation: [{level: 'error', message: 'User name is required', path: ['userName']}],
        })}
      />
    </Frame>
  ),
}

function baseAnnotationProps(overrides: Partial<BlockAnnotationProps> = {}): BlockAnnotationProps {
  return {
    __unstable_floatingBoundary: null,
    __unstable_referenceBoundary: null,
    __unstable_referenceElement: null,
    __unstable_textElementFocus: false,
    children: null,
    focused: false,
    // oxlint-disable-next-line no-deprecated -- markers is a required field on the real BlockProps type
    markers: [],
    onClose: () => undefined,
    onOpen: () => undefined,
    onPathFocus: () => undefined,
    onRemove: () => undefined,
    open: false,
    parentSchemaType: blockParentType,
    path: [],
    presence: [],
    readOnly: false,
    renderDefault: DefaultAnnotationComponent,
    renderField: noopRenderField,
    renderInput: noopRenderInput,
    renderItem: noopRenderItem,
    renderPreview: previewResolved,
    schemaType: linkSchemaType,
    selected: false,
    textElement: <span>sanity.io</span>,
    validation: [],
    value: {
      _type: 'link',
      _key: 'linkAnn',
      href: 'https://www.sanity.io',
    } as unknown as PortableTextObject,
    ...overrides,
  }
}

/** `schemaType.name === 'link'` with no error/warning → tone `primary` (Annotation.tsx:299-312). */
export const DefaultAnnotationLinkTone: Story = {
  name: 'DefaultAnnotationComponent - link (tone primary)',
  render: () => (
    <SelectedAnnotationsProvider>
      <Frame>
        <DefaultAnnotationComponent {...baseAnnotationProps()} />
      </Frame>
    </SelectedAnnotationsProvider>
  ),
}

/** `hasError` is checked first in the same ladder (Annotation.tsx:300-302): tone `critical` wins over `isLink`. */
export const DefaultAnnotationValidationErrorTone: Story = {
  name: 'DefaultAnnotationComponent - validation error overrides link tone (critical)',
  render: () => (
    <SelectedAnnotationsProvider>
      <Frame>
        <DefaultAnnotationComponent
          {...baseAnnotationProps({
            validation: [{level: 'error', message: 'A URL is required', path: ['href']}],
          })}
        />
      </Frame>
    </SelectedAnnotationsProvider>
  ),
}

// ============================================================================
// CombinedAnnotationPopover: two returns (CombinedAnnotationPopover.tsx:139-141, 143-204).
// Needs a real `usePortableTextEditor()`, so it is exercised through FormBuilderHarness,
// the same way PortableTextEditModals.stories.tsx exercises its own editor-bound chrome.
// `InlineObjectToolbarPopover` shares the same `usePortableTextEditor()` requirement but,
// unlike an annotation's text selection, its `focused` state comes from the editor's own
// void-element focus tracking - there is no equivalent of `AnnotationLink`'s
// mousedown+setBaseAndExtent recipe for a void inline object, and no `openPath` reaches it
// either (`openPath` drives `member.open`, the edit-modal state, not toolbar-popover focus).
// Building it would mean guessing at an uverified interaction; it is quoted from source
// instead, matching how PortableTextEditModals.stories.tsx treated its own ref-registration
// race: `InlineObjectToolbarPopover.tsx:88-98` closes on `inlineObjectOpen`, opens on
// `inlineObjectFocused`, and otherwise stays closed - the same three-state shape as the
// annotation popover below, minus the "combined" behaviour, since a single inline object
// has nothing to combine with.
// ============================================================================

/**
 * **Idle.** No annotation is selected anywhere in this render, so `CombinedAnnotationPopover`
 * (mounted unconditionally alongside every Portable Text editor) returns `null`
 * (`annotations.length === 0`, line 139). Every other story on this page that never selects
 * a link annotation is, invisibly, this same state - matching how `AnnotationIdle` treats
 * `AnnotationObjectEditModal` in `PortableTextEditModals.stories.tsx`.
 */
export const CombinedAnnotationPopoverIdle: Story = {
  name: 'CombinedAnnotationPopover - idle (no annotation selected)',
  render: () => <PostEditor body={annotationBody} height={200} />,
}

/**
 * **Open, single annotation.** The play function places the caret inside the "sanity.io"
 * link span, the same interaction `AnnotationLink` in `PortableTextInput.stories.tsx` uses.
 * `DefaultAnnotationComponent`'s registration effect (`Annotation.tsx:289-297`) adds this
 * annotation to the shared context, and the popover renders its title with Edit/Remove.
 */
export const CombinedAnnotationPopoverOpen: Story = {
  name: 'CombinedAnnotationPopover - open (single annotation)',
  parameters: {docs: {story: {inline: false, height: '360px'}}},
  render: () => <PostEditor body={annotationBody} height={200} />,
  play: async ({canvasElement}) => selectLinkAnnotation(canvasElement),
}

// ============================================================================
// Toolbar: one new state beyond what PortableTextInput.stories.tsx already shows (every
// `PostEditor` render there mounts the real Toolbar). `bareNote`'s block type sets
// `styles` to a single entry, `lists: []` and `marks: {decorators: [], annotations: []}`
// with no `of`, so `InnerToolbar.tsx:85-91,101-163` finds `showBlockStyleSelect`,
// `showActionMenu` and `showInsertMenu` all false - everything collapses away but the
// fullscreen toggle.
// ============================================================================

export const ToolbarNoApplicableGroups: Story = {
  name: 'Toolbar - no applicable groups (fullscreen toggle only)',
  render: () => <PostEditor body={bareBody} documentType="bareNote" height={160} />,
}

// ============================================================================
// ActionMenu: real editor. `groups` come from `getPTEToolbarActionGroups`
// (toolbar/helpers.ts:126-156): format, list, annotation, in that order, with
// `dividerBefore` on each group's first action (ActionMenu.tsx:61,100).
// ============================================================================

/** Caret placed in populated text, menu opened: format / list / annotation groups, dividers between them. */
export const ActionMenuOpenWithGroups: Story = {
  name: 'ActionMenu - open (format / list / annotation groups)',
  parameters: {docs: {story: {inline: false, height: '360px'}}},
  render: () => <PostEditor body={populatedBody} height={220} />,
  play: async ({canvasElement}) => openActionMenu(canvasElement),
}

/**
 * Caret placed in an *empty* paragraph: `ActionMenu.tsx:48-52` computes `isEmptyTextBlock`,
 * which disables the annotation action and swaps its tooltip for
 * `annotation-disabled_empty-block` (line 82-85) - the disabled state carries an explicit
 * reason, unlike the two gaps findings 114/142 flagged elsewhere in this subsystem. The
 * reason lives in `tooltipProps.content` (hover-only, matching how the deprecated insert
 * item's reason is surfaced in `PortableTextInput.stories.tsx`), so it is not visible in a
 * static screenshot without hovering; quoted here rather than forced open.
 */
export const ActionMenuAnnotationDisabledReason: Story = {
  name: 'ActionMenu - annotation disabled on an empty block (reason in tooltip)',
  parameters: {docs: {story: {inline: false, height: '360px'}}},
  render: () => <PostEditor body={emptyBody} height={200} />,
  play: async ({canvasElement}) => openActionMenu(canvasElement),
}

// ============================================================================
// CustomIcon: the string-icon fallback path. `toolbar/helpers.tsx:236-238`
// (`getActionIcon`) reaches for this component only when `action.icon` is a `string`
// (a URL), never for the `@sanity/icons` components every default decorator/list/link
// action uses - so it never appears in `PortableTextInput.stories.tsx`'s real toolbar.
// One return (CustomIcon.tsx:20-32): a sized div with the icon as a CSS background image,
// inverted when `active`.
// ============================================================================

const sampleIconUri =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" rx="3" fill="%23000"/></svg>'

export const CustomIconStates: Story = {
  name: 'CustomIcon - active vs. inactive (string-icon fallback)',
  render: () => (
    <Flex gap={4} align="center" padding={3}>
      <Stack gap={2}>
        <Text size={1} muted>
          Inactive
        </Text>
        <Card border padding={2} radius={2} style={{width: 32, height: 32}}>
          <CustomIcon icon={sampleIconUri} active={false} />
        </Card>
      </Stack>
      <Stack gap={2}>
        <Text size={1} muted>
          Active (inverted)
        </Text>
        <Card border padding={2} radius={2} tone="primary" style={{width: 32, height: 32}}>
          <CustomIcon icon={sampleIconUri} active />
        </Card>
      </Stack>
    </Flex>
  ),
}

// ============================================================================
// UserPresenceCursor: standalone under WithStudioProviders (it seeds a real
// UserColorManagerContext). Hover is simulated via a play function dispatching
// `mouseenter` on the cursor line - React 17+ delegates mouseenter/mouseleave through a
// capture-phase root listener, so a dispatched event reaches the component's own handler.
// ============================================================================

const resolvedUser: User = {id: 'user-ada', displayName: 'Ada Lovelace'}
const namelessUser: User = {id: 'user-ghost'}

/** Not hovered: just the cursor line and its dot (UserPresenceCursor.tsx:127-160). */
export const UserPresenceCursorIdle: Story = {
  name: 'UserPresenceCursor - idle (not hovered)',
  render: () => (
    <Card padding={4} style={{maxWidth: 320}}>
      <Text size={2}>
        Reviewed with <UserPresenceCursor user={resolvedUser} /> before publishing.
      </Text>
    </Card>
  ),
}

/** Hovered: the name box fades in (UserPresenceCursor.tsx:134-157), colour-keyed to the user id via `useUserColor`. */
export const UserPresenceCursorHoverRevealsName: Story = {
  name: 'UserPresenceCursor - hovered (name revealed)',
  render: () => (
    <Card padding={4} style={{maxWidth: 320}}>
      <Text size={2}>
        Reviewed with <UserPresenceCursor user={resolvedUser} /> before publishing.
      </Text>
    </Card>
  ),
  play: async ({canvasElement}) => hoverElement(canvasElement, 'presence-cursor-Ada-Lovelace'),
}

/**
 * `User.displayName` is optional (`@sanity/types`); this component has no fallback for its
 * absence. Hovering reveals an empty name box, and the component's own `data-testid`
 * (line 120-123) resolves to the literal string `presence-cursor-undefined` - the finding
 * quoted in the page docblock.
 */
export const UserPresenceCursorMissingDisplayName: Story = {
  name: 'UserPresenceCursor - user with no displayName (empty label, testid "…-undefined")',
  render: () => (
    <Card padding={4} style={{maxWidth: 320}}>
      <Text size={2}>
        Reviewed with <UserPresenceCursor user={namelessUser} /> before publishing.
      </Text>
    </Card>
  ),
  play: async ({canvasElement}) => hoverElement(canvasElement, 'presence-cursor-undefined'),
}

// ============================================================================
// PortableTextEditorPlugins / PortableTextTablePlugin: the plugin-registration dispatcher
// (Plugins.tsx:34-135) mounted alongside every real editor above, invisibly. Its table
// plugin is opt-in twice over: the schema must include the table member type, and
// `DefaultTablePlugin` (Plugins.tsx:175-182) additionally requires `props?.enabled === true`
// from a `components.portableText.plugins` override - no field in this page's schema sets
// either, so `PortableTextTablePlugin` never mounts and `DefaultTablePlugin` returns `null`
// (line 178) on every render above, the same "present now, renders null" shape
// `AnnotationIdle` documents for `AnnotationObjectEditModal`. Building the enabled state
// would need a working `TableContainers` binding this page cannot verify without a build,
// so it is deliberately left as a documented default rather than an unverified positive.
// ============================================================================

export const PortableTextPluginsIdleDefault: Story = {
  name: 'PortableTextEditorPlugins - default (table plugin opted out, renders null)',
  render: () => <PostEditor body={populatedBody} height={200} />,
}

// ============================================================================
// Closing: in context. A real document combining a mention, a link annotation and a
// callout, with two collaborators (one resolved, one nameless) shown active nearby.
// ============================================================================

/**
 * In context: a real `FormBuilder` over a document whose Body carries a mention, a link
 * annotation and a callout together, the everyday mix this page's pieces dress. Below it,
 * two collaborators are "active now" - one resolved, one not - the same contrast the
 * `UserPresenceCursor` findings above are about.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <Stack gap={4}>
      <PostEditor body={richBody} height={260} />
      <Card padding={3} tone="transparent" style={{maxWidth: 640, marginLeft: 12}}>
        <Stack gap={2}>
          <Text size={1} muted>
            Active now
          </Text>
          <Text size={2}>
            <UserPresenceCursor user={resolvedUser} /> and{' '}
            <UserPresenceCursor user={namelessUser} /> are viewing this document.
          </Text>
        </Stack>
      </Card>
    </Stack>
  ),
}
