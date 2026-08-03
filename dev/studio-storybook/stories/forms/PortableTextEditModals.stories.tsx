import {
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// Real components, real paths (org contract §8). None of these four are re-exported
// from the `sanity` package's public entry point, so they are reached the same way
// Dialog.stories.tsx reaches the ui-components barrel: a direct relative import into
// source, not through `sanity`'s exports map. `AnnotationObjectEditModal` itself is not
// imported here: like `BlockObject`/`InlineObject`, it needs the real Portable Text
// editor context (`usePortableTextEditor`, the member-items and element-refs contexts)
// to do anything meaningful. Matching how `PortableTextInput.stories.tsx` treats its own
// PT sub-components, it is exercised by mounting the real editor (`FormBuilderHarness`)
// and letting `Compositor.tsx` mount it, not by calling it directly.
import {DefaultEditDialog} from '../../../../packages/sanity/src/core/form/inputs/PortableText/object/modals/DialogModal'
import {ObjectEditModal} from '../../../../packages/sanity/src/core/form/inputs/PortableText/object/modals/ObjectEditModal'
import {PopoverEditDialog} from '../../../../packages/sanity/src/core/form/inputs/PortableText/object/modals/PopoverModal'
import {useWorkspace} from '../../../../packages/sanity/src/core/studio/workspace'
import {NamedPortalFrame} from '../../lib/documentGroupInventoryFrame'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Schema for every story on this page: a `post` document whose `body` holds
 * - `callout`: a block-level object, **no** `options.modal` (position default applies)
 * - `sidenote`: the same shape, `options: {modal: {type: 'popover', width: 2}}` (schema
 *   author overrides the position default)
 * - a `block` whose inline `of` carries `mention` (no override) and `mentionDialog`
 *   (`options: {modal: {type: 'dialog'}}`), the inline-side mirror of the same override
 *
 * This is the smallest schema that reaches every branch `ObjectEditModal` can take:
 * two object kinds (block / inline) crossed with two override states (unset / set).
 */
const schemaTypes: SchemaTypeDefinition[] = [
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
    name: 'sidenote',
    title: 'Sidenote',
    type: 'object',
    options: {modal: {type: 'popover', width: 2} as const},
    fields: [
      {name: 'heading', title: 'Heading', type: 'string'},
      {name: 'note', title: 'Note', type: 'text'},
    ],
    preview: {select: {title: 'heading', subtitle: 'note'}},
  },
  {
    name: 'mention',
    title: 'Mention',
    type: 'object',
    fields: [{name: 'userName', title: 'User name', type: 'string'}],
    preview: {select: {title: 'userName'}},
  },
  {
    name: 'mentionDialog',
    title: 'Mention (forced dialog)',
    type: 'object',
    options: {modal: {type: 'dialog', width: 1} as const},
    fields: [{name: 'userName', title: 'User name', type: 'string'}],
    preview: {select: {title: 'userName'}},
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
        of: [
          {type: 'block', of: [{type: 'mention'}, {type: 'mentionDialog'}]},
          {type: 'callout'},
          {type: 'sidenote'},
        ],
      },
    ],
  },
]

interface SpanSpec {
  text: string
  marks?: string[]
}

let keyCounter = 0
function block(
  spans: SpanSpec[],
  markDefs: {_key: string; _type: string; [prop: string]: unknown}[] = [],
): PortableTextBlock {
  keyCounter += 1
  return {
    _type: 'block',
    _key: `blk${keyCounter}`,
    style: 'normal',
    markDefs,
    children: spans.map((span, index) => ({
      _type: 'span',
      _key: `blk${keyCounter}s${index}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
  }
}

// --- Fixtures, one per open state, each paired with the `openPath` that opens it at
// mount. Driving state through the resolved form tree (rather than a play-function
// click) is deterministic in a static build: no editor-selection or ref-registration
// timing to race. `usePortableTextMemberItemsFromProps` reads `member.open` straight
// off the resolved member for object blocks, inline objects and markDefs annotations
// alike, so an `openPath` pointing at any of the three opens it the same way.

const calloutBody: PortableTextBlock[] = [
  block([{text: 'A block-level object with no schema override:'}]),
  {
    _type: 'callout',
    _key: 'calloutA',
    heading: 'Ship structured content',
    note: 'BlockObject calls ObjectEditModal with defaultType="dialog".',
  },
  block([{text: 'Text continues after it.'}]),
]
const calloutOpenPath: Path = ['body', {_key: 'calloutA'}]

const sidenoteBody: PortableTextBlock[] = [
  block([{text: 'The same shape, with options.modal.type set to "popover":'}]),
  {
    _type: 'sidenote',
    _key: 'sidenoteA',
    heading: 'Aside',
    note: 'The schema author’s choice overrides BlockObject’s position default.',
  },
  block([{text: 'Text continues after it.'}]),
]
const sidenoteOpenPath: Path = ['body', {_key: 'sidenoteA'}]

const mentionBlockKey = 'mentionBlkA'
const mentionBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: mentionBlockKey,
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'mentionSpanA', text: 'Reviewed with ', marks: []},
      {_type: 'mention', _key: 'mentionA', userName: 'Ada Lovelace'},
      {_type: 'span', _key: 'mentionSpanB', text: ' before publishing.', marks: []},
    ],
  },
]
const mentionOpenPath: Path = ['body', {_key: mentionBlockKey}, 'children', {_key: 'mentionA'}]

const mentionDialogBlockKey = 'mentionDialogBlkA'
const mentionDialogBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: mentionDialogBlockKey,
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'mdSpanA', text: 'Reviewed with ', marks: []},
      {_type: 'mentionDialog', _key: 'mentionDialogA', userName: 'Ada Lovelace'},
      {_type: 'span', _key: 'mdSpanB', text: ' before publishing.', marks: []},
    ],
  },
]
const mentionDialogOpenPath: Path = [
  'body',
  {_key: mentionDialogBlockKey},
  'children',
  {_key: 'mentionDialogA'},
]

const annotationLinkKey = 'annLink1'
const annotationBlockKey = 'annBlkA'
const annotationBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: annotationBlockKey,
    style: 'normal',
    markDefs: [{_key: annotationLinkKey, _type: 'link', href: 'https://www.sanity.io'}],
    children: [
      {_type: 'span', _key: 'annSpanA', text: 'Read the docs at ', marks: []},
      {_type: 'span', _key: 'annSpanB', text: 'sanity.io', marks: [annotationLinkKey]},
      {_type: 'span', _key: 'annSpanC', text: ' for the full model.', marks: []},
    ],
  },
]
const annotationOpenPath: Path = [
  'body',
  {_key: annotationBlockKey},
  'markDefs',
  {_key: annotationLinkKey},
]

/** Shared render root: a real `FormBuilder` over the shared `post` schema. */
function PostEditor(props: {body?: PortableTextBlock[]; openPath?: Path; height?: number}) {
  const {body, openPath, height = 360} = props
  return (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType="post"
        initialDocument={body ? {body} : undefined}
        openPath={openPath}
        height={height}
      />
    </Box>
  )
}

const meta: Meta = {
  title: 'Forms & Input/Portable Text Edit Modals',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'An editor who opens something inside rich text, a block-level object, an inline ' +
            'object, or a link mark, lands in one of two edit surfaces, and which one they get ' +
            'tracks where in the document tree the thing sits, not what kind of edit they are ' +
            'making. Four small files make that call, and one of the two surfaces they can choose ' +
            'between is functionally dead in a real Studio session.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/PortableText/object/modals/{ObjectEditModal,AnnotationObjectEditModal,DialogModal,PopoverModal}.tsx` |',
          '| Tier | SERVICE. Decides whether an edit surface lands in a dialog or a popover, and hosts either one. It carries no content model of its own; the fields inside come from whatever object schema is being edited |',
          '| Findings | 2: the dispatch keys on tree position, not edit kind, and the dialog leaf’s default branch is unreachable in a real Studio session |',
          '',
          'The chrome an editor lands in when they open something inside rich text: a block-level ' +
            'object, an inline object, or an annotation (a mark on some words, like a link). Four ' +
            'small files do the whole job: `ObjectEditModal` decides dialog vs. popover and ' +
            'dispatches to one; `AnnotationObjectEditModal` is the annotation-specific host that ' +
            'finds the one open annotation and hands it to `ObjectEditModal`; `DialogModal` and ' +
            '`PopoverModal` are the two leaf presentations.',
          '',
          'None of this has been storied before, and the reason is structural: these four files ' +
            'sit *between* the Portable Text editor (`PortableTextInput.stories.tsx`, in this same ' +
            'chapter) and the two general-purpose overlay primitives (`Dialog.stories.tsx`, ' +
            '`PopoverDialog.stories.tsx`, in Overlays & Navigation). This page is the seam: what ' +
            'decides which of those two an editor gets, for which kind of object.',
          '',
          'A second finding, upstream of the dispatch itself: the "dialog" default never actually ' +
            'reaches `DialogModal`’s `DefaultEditDialog` in a real Studio session. `FormBuilder.tsx` ' +
            'wraps every document form in `<EnhancedObjectDialogProvider>` unconditionally, with no ' +
            'prop threading a way to disable it, so `ObjectEditModal`’s own fallback branch is ' +
            'unreachable except by mounting it in isolation, as this page does. `DefaultEditDialog` ' +
            'is exactly the "mounts fine, is never mounted" shape the codex warns about (see the ' +
            'storybook-authoring skill’s Navbar / `studio.components.logo` finding): it renders ' +
            'correctly, and nothing in the shipped app ever reaches it.',
          '',
          '> **Why it matters:** the dialog-vs-popover choice looks like it tracks "type of edit" ' +
            '(annotation vs. object), but source says otherwise: it tracks where in the tree the ' +
            'thing being edited sits, and that default can be overridden per schema type. A ' +
            'block-level object defaults to the heavier dialog surface; an inline object or an ' +
            'annotation defaults to the lighter popover, and the schema author can flip either with ' +
            'one line.',
          '',
          '### The dispatch, from source',
          '',
          '`_getModalOption(schemaType)` (`object/helpers.ts:16`) reads `schemaType.options?.modal`: the **schema author’s** explicit choice, if any. `ObjectEditModal` (`ObjectEditModal.tsx:32`) then computes `modalType = schemaModalOption?.type || defaultType`, where `defaultType` is supplied by the **caller** based on structural position: `BlockObject.tsx:446` passes `"dialog"` for a whole embedded block, `InlineObject.tsx:322` and `AnnotationObjectEditModal.tsx:49` both pass `"popover"` for an inline object or a mark on a span. So annotations and inline objects are treated alike by default (both stay light); a block gets the heavier surface by default. Either can be overridden per schema type; `sidenote` and `mentionDialog` below do exactly that, in opposite directions.',
          '',
          'For the `"dialog"` outcome specifically, there is a third fork nobody sets from schema: `nestedObjectNavigationEnabled` (`ObjectEditModal.tsx:34`, from the deprecated `useEnhancedObjectDialog()`) picks between the tree-editing `EnhancedObjectDialog` and the plain `DefaultEditDialog`. `FormBuilder.tsx:329` mounts `<EnhancedObjectDialogProvider>` with no props around every document form, which always resolves to `{enabled: true}`, so every "dialog" story below that goes through a real `FormBuilder` renders `EnhancedObjectDialog`, never `DefaultEditDialog`. The isolated story further down mounts `ObjectEditModal` outside any `FormBuilder`, which is the only way left to reach the branch at all.',
          '',
          '### Unsaved changes and empty schemas',
          '',
          "These modals do not buffer edits for a save/cancel choice. Like the rest of the form builder, every keystroke already patches the real document through the same patch channel, so there is nothing to discard on close, and none of the three `onClose` handlers (`BlockObject.tsx:145`, `InlineObject.tsx:114`, `AnnotationObjectEditModal.tsx:23`) ask. The one exception is silent, not a confirmation: `AnnotationObjectEditModal.tsx:30` calls `isEmptyItem` on close and removes the annotation outright if it holds no value, so an empty link mark disappears with no prompt. Neither an unresolvable schema type nor a fields-less object type gets a distinct state in these four files; an unresolvable type is intercepted further upstream (`formState.ts`'s `INCOMPATIBLE_TYPE` synthesis, `ObjectInputMember`'s territory, out of scope here), and a fields-less object type would render whatever `FormBuilder` renders for zero fields inside whichever chrome `ObjectEditModal` already picked; the chrome itself has no branch for it.",
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: ['autodocs', 'chapter:forms', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

// ============================================================================
// ObjectEditModal: the dispatcher. Three returns in source (ObjectEditModal.tsx:53,
// 70-79, 80-88): popover / EnhancedObjectDialog / DefaultEditDialog. The four stories
// below hold object-kind (block vs. inline) and override (unset vs. set) constant one
// at a time, so each swap is a single-variable change against the previous story.
// ============================================================================

/**
 * **Block object, no override.** `callout` sets no `options.modal`, so `BlockObject`'s
 * `defaultType="dialog"` stands. Because this mounts through a real `FormBuilder`
 * (via `FormBuilderHarness`), `nestedObjectNavigationEnabled` is `true`, so the dialog
 * that actually opens is `EnhancedObjectDialog`, not `DefaultEditDialog`. This is the
 * one dialog-shaped state reachable in a real Studio session.
 */
export const CalloutDialogByPosition: Story = {
  name: 'Block object → dialog (position default, real EnhancedObjectDialog)',
  parameters: {docs: {story: {inline: false, height: '520px'}}},
  render: () => <PostEditor body={calloutBody} openPath={calloutOpenPath} height={280} />,
}

/**
 * **Block object, schema override.** `sidenote` is shaped exactly like `callout` but
 * carries `options: {modal: {type: 'popover', width: 2}}`: the schema author's choice
 * wins over `BlockObject`'s position default, and the object opens in a popover instead.
 */
export const SidenotePopoverByOverride: Story = {
  name: 'Block object → popover (schema override)',
  parameters: {docs: {story: {inline: false, height: '520px'}}},
  render: () => <PostEditor body={sidenoteBody} openPath={sidenoteOpenPath} height={280} />,
}

/**
 * **Inline object, no override.** `mention` sets no `options.modal`, so `InlineObject`'s
 * `defaultType="popover"` stands: the same default an annotation gets, and the
 * opposite of a block object's default.
 */
export const MentionPopoverByPosition: Story = {
  name: 'Inline object → popover (position default)',
  parameters: {docs: {story: {inline: false, height: '480px'}}},
  render: () => <PostEditor body={mentionBody} openPath={mentionOpenPath} height={220} />,
}

/**
 * **Inline object, schema override.** `mentionDialog` is `mention` with
 * `options: {modal: {type: 'dialog'}}` added: the override flips an inline object into
 * the same `EnhancedObjectDialog` the block-object story above reaches, proving the
 * override, not the object kind, is what ultimately lands here.
 */
export const MentionDialogByOverride: Story = {
  name: 'Inline object → dialog (schema override)',
  parameters: {docs: {story: {inline: false, height: '520px'}}},
  render: () => (
    <PostEditor body={mentionDialogBody} openPath={mentionDialogOpenPath} height={220} />
  ),
}

/**
 * **The branch a real Studio session cannot reach.** `ObjectEditModal` is mounted here
 * directly, outside any `FormBuilder`, so `useEnhancedObjectDialog()` resolves to its
 * built-in default (`{enabled: false}`), and `modalType === 'dialog'` now falls to
 * `DefaultEditDialog` (`DialogModal.tsx`'s only export) instead of `EnhancedObjectDialog`.
 * This is also, doubly, `DefaultEditDialog`'s own standalone contract: a `Dialog` with a
 * translated title, `width` passthrough (default `1`), `autoFocus`, presence and a
 * scroll-boundary for its children. That is the same shape the four stories above never
 * render, because nothing outside this isolated mount can turn `nestedObjectNavigationEnabled`
 * off. Content here is illustrative (`Text`, not resolved schema fields); this story
 * proves which chrome is chosen, matching how `Dialog.stories.tsx` and
 * `PopoverDialog.stories.tsx` treat their own standalone frame stories.
 *
 * **Named-portal fix (2026-07-30).** This story and the two below it used to mount their
 * dialog/popover directly and render nothing at all, silently - confirmed live against the
 * unfixed build (story id isolated-default-edit-dialog, viewMode=story): the explanatory text
 * rendered, but no dialog testid, no `[data-ui="Dialog"]`, nothing. `DialogModal.tsx`'s `Dialog`
 * hardcodes `portal="default"`, a STRING name, not `true` - the same trap
 * `lib/documentGroupInventoryFrame.tsx` documents and that cluster 1 on this same page hit for
 * `BlockObjectActionsMenu`. `@sanity/ui` resolves a string `portal` prop through the ambient
 * `PortalProvider`'s NAMED elements map; `WithStudioProviders` supplies none, so the whole dialog
 * mounts an empty subtree with no error. Fixed with `NamedPortalFrame`, `portalElementName`
 * 'default' - this story's own local boundary Box is unaffected, it is a separate concern
 * (`floatingBoundary`/`referenceBoundary`, passed directly) from where the portal itself renders.
 */
export const IsolatedDefaultEditDialog: Story = {
  name: 'Dialog branch, nested navigation disabled (isolated mount, DefaultEditDialog)',
  parameters: {docs: {story: {inline: false, height: '420px'}}},
  render: () => (
    <NamedPortalFrame portalElementName="default">
      <IsolatedDefaultEditDialogDemo />
    </NamedPortalFrame>
  ),
}

function IsolatedDefaultEditDialogDemo() {
  const workspace = useWorkspace()
  const schemaType = workspace.schema.get('callout') as ObjectSchemaType | undefined
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  if (!schemaType) {
    throw new Error('IsolatedDefaultEditDialogDemo: missing schema type "callout"')
  }
  return (
    <Box ref={setBoundary} padding={4} style={{minHeight: 320, position: 'relative'}}>
      <Text size={1} muted>
        No FormBuilder is mounted around this box, only WithStudioProviders. That absence is the
        fixture: it is what makes DefaultEditDialog reachable at all.
      </Text>
      <ObjectEditModal
        autoFocus
        defaultType="dialog"
        floatingBoundary={boundary}
        onClose={() => undefined}
        referenceBoundary={boundary}
        referenceElement={null}
        schemaType={schemaType}
      >
        <Stack gap={3} padding={4}>
          <Text size={1} weight="medium">
            Heading
          </Text>
          <Text size={1} muted>
            Illustrative content, not a resolved form. This story is evidence about the dispatch,
            not about the callout's fields.
          </Text>
        </Stack>
      </ObjectEditModal>
    </Box>
  )
}

// ============================================================================
// AnnotationObjectEditModal: three returns in source (AnnotationObjectEditModal.tsx:37,
// 43, 47): no open annotation / element ref missing-or-outside-boundary / rendered.
// The first two are visually identical (both render null); only the third has an
// appearance. The middle one guards a ref-registration race between an annotation's
// `member.open` flipping true and its DOM element being registered in
// `PortableTextMemberItemElementRefsProvider`, a transient condition, not a state an
// editor can land on and see, so it is quoted here rather than built.
// ============================================================================

/**
 * **Idle.** `AnnotationObjectEditModal` is mounted unconditionally as chrome inside
 * `Compositor.tsx` (line 598) alongside every Portable Text editor; it is present right
 * now, and returns `null` because `portableTextMemberItems.find(...)` finds no annotation
 * with `member.open`. Every other story in `PortableTextInput.stories.tsx` that never
 * opens an annotation is, invisibly, this same state.
 */
export const AnnotationIdle: Story = {
  name: 'Annotation modal idle (no annotation open)',
  render: () => <PostEditor body={annotationBody} height={220} />,
}

/**
 * **Open, rendered.** The link annotation's `markDefs` member is opened via `openPath`,
 * so `AnnotationObjectEditModal` finds it, confirms its element ref sits inside
 * `referenceBoundary`, and hands it to `ObjectEditModal` with `defaultType="popover"`:
 * the same popover default an inline object gets, reached through the annotation-specific
 * host instead of directly.
 */
export const AnnotationOpen: Story = {
  name: 'Annotation modal open (link, via popover)',
  parameters: {docs: {story: {inline: false, height: '480px'}}},
  render: () => <PostEditor body={annotationBody} openPath={annotationOpenPath} height={220} />,
}

// ============================================================================
// PopoverModal: one export, `PopoverEditDialog` (plus a module-local `Content`, which
// cannot be mounted on its own: it is unexported and only reachable by rendering its
// parent). Standalone, anchored to a trigger, matching PopoverDialog.stories.tsx's own
// harness shape.
// ============================================================================

function PopoverEditDialogStandaloneDemo() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(true)
  return (
    <Box>
      <Button
        ref={setRef}
        text={open ? 'Popover open' : 'Open popover'}
        mode="ghost"
        onClick={() => setOpen(true)}
      />
      {open && (
        <PopoverEditDialog
          autoFocus
          floatingBoundary={null}
          onClose={() => setOpen(false)}
          referenceBoundary={null}
          referenceElement={ref}
          title="Edit sidenote"
          width={2}
        >
          <Stack gap={3}>
            <Text size={1} weight="medium">
              Heading
            </Text>
            <Text size={1} muted>
              The header, the close button, the focus lock and the click-outside-to-close all belong
              to PopoverEditDialog itself, not to whatever schema fields end up inside it.
            </Text>
          </Stack>
        </PopoverEditDialog>
      )}
    </Box>
  )
}

/**
 * `PopoverEditDialog` on its own: a sticky header with the title and a close button,
 * a scrollable body, `react-focus-lock` scoped to the portal, and a click-outside
 * handler that closes it (`useClickOutsideEvent`, `PopoverModal.tsx:103`). The module-local
 * `Content` function that actually renders all of this cannot be given its own story:
 * it is not exported, so it is only reachable exactly as it is here, through its parent.
 *
 * Same named-portal fix as `IsolatedDefaultEditDialog` above - see its docblock. `PopoverModal.tsx`'s
 * `RootPopover` also hardcodes `portal="default"`; without `NamedPortalFrame` this rendered nothing,
 * confirmed live the same way (button read "Popover open" - `open` state true - but no
 * `[data-testid="popover-edit-dialog"]` node anywhere in the document).
 */
export const PopoverEditDialogStandalone: Story = {
  name: 'PopoverEditDialog, standalone',
  parameters: {docs: {story: {inline: false, height: '380px'}}},
  render: () => (
    <NamedPortalFrame portalElementName="default">
      <PopoverEditDialogStandaloneDemo />
    </NamedPortalFrame>
  ),
}

// ============================================================================
// Closing: the two leaf presentations side by side.
// ============================================================================

function PresentationsSideBySideDemo() {
  const [popoverRef, setPopoverRef] = useState<HTMLButtonElement | null>(null)
  return (
    <Flex gap={4} align="flex-start" wrap="wrap">
      <Card padding={3} radius={2} border style={{flex: '1 1 320px'}}>
        <Stack gap={3}>
          <Text size={1} weight="medium">
            DialogModal: DefaultEditDialog
          </Text>
          <DefaultEditDialog onClose={() => undefined} title="Edit callout" width={1}>
            <Text size={1} muted>
              Centered, modal, blocks the rest of the page.
            </Text>
          </DefaultEditDialog>
        </Stack>
      </Card>
      <Card padding={3} radius={2} border style={{flex: '1 1 320px'}}>
        <Stack gap={3}>
          <Text size={1} weight="medium">
            PopoverModal: PopoverEditDialog
          </Text>
          <Button ref={setPopoverRef} text="Anchor" mode="ghost" />
          <PopoverEditDialog
            floatingBoundary={null}
            onClose={() => undefined}
            referenceBoundary={null}
            referenceElement={popoverRef}
            title="Edit sidenote"
          >
            <Text size={1} muted>
              Anchored to its trigger, lets you click into sibling content.
            </Text>
          </PopoverEditDialog>
        </Stack>
      </Card>
    </Flex>
  )
}

/**
 * The two leaf presentations side by side, mounted directly (not through `ObjectEditModal`'s
 * dispatch): `DefaultEditDialog` (centered, modal) on the left, `PopoverEditDialog` (anchored,
 * non-blocking) on the right. Same job (host whatever object input is inside), different
 * commitment: a dialog takes over the screen, a popover stays put beside what opened it.
 *
 * Same named-portal fix as the two stories above - see `IsolatedDefaultEditDialog`'s docblock.
 * Both leaves hardcode `portal="default"`, so both were silently absent here too, confirmed live:
 * the two card headings and the "Anchor" button rendered, neither leaf did.
 */
export const PresentationsSideBySide: Story = {
  name: 'Dialog vs. popover, side by side',
  parameters: {docs: {story: {inline: false, height: '420px'}}},
  render: () => (
    <NamedPortalFrame portalElementName="default">
      <PresentationsSideBySideDemo />
    </NamedPortalFrame>
  ),
}
