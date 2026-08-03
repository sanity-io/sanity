import {defineSchema, EditorProvider, type InvalidValueResolution} from '@portabletext/editor'
import {type ArraySchemaType, type ObjectSchemaType, type PortableTextBlock} from '@sanity/types'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useMemo, useState} from 'react'
import {
  CommentsAuthoringPathContext,
  CommentsContext,
  CommentsEnabledContext,
  CommentsSelectedPathContext,
} from 'sanity/_singletons'

import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
import {type CommentsContextValue} from '../../../../packages/sanity/src/core/comments/context/comments/types'
import {type CommentsSelectedPath} from '../../../../packages/sanity/src/core/comments/context/selected-path/types'
import {CommentsField} from '../../../../packages/sanity/src/core/comments/plugin/field/CommentsField'
import {CommentsInput} from '../../../../packages/sanity/src/core/comments/plugin/input/CommentsInput'
import {FloatingButtonPopover} from '../../../../packages/sanity/src/core/comments/plugin/input/components/FloatingButtonPopover'
import {InlineCommentInputPopover} from '../../../../packages/sanity/src/core/comments/plugin/input/components/InlineCommentInputPopover'
import {type ObjectDiff} from '../../../../packages/sanity/src/core/field/types'
import {PortableText as PortableTextDiffView} from '../../../../packages/sanity/src/core/field/types/portableText/diff/components/PortableText'
import {createPortableTextDiff} from '../../../../packages/sanity/src/core/field/types/portableText/diff/helpers'
import {BlockActions} from '../../../../packages/sanity/src/core/form/inputs/PortableText/BlockActions'
import {InvalidValue} from '../../../../packages/sanity/src/core/form/inputs/PortableText/InvalidValue'
import {type RenderBlockActionsCallback} from '../../../../packages/sanity/src/core/form/types/_transitional'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {currentUserDoug, fixtureMentionOptions} from '../../lib/mockCollabFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Schema for the shell/dispatcher demos: a bare Portable Text document (no comments
 * wiring), a document with a plain string field beside a Portable Text field (for the
 * `CommentsInput` dispatcher), a document whose Portable Text field carries the real
 * `CommentsField` component override (for the comments-enabled demos), and a document
 * used only to compute real field diffs.
 */
const schemaTypes = [
  {
    name: 'shellPost',
    title: 'Shell post',
    type: 'document',
    fields: [{name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]}],
  },
  {
    name: 'dispatchPost',
    title: 'Dispatch post',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]},
    ],
  },
  {
    name: 'commentsPost',
    title: 'Comments post',
    type: 'document',
    fields: [
      {
        name: 'body',
        title: 'Body',
        type: 'array',
        of: [{type: 'block'}],
        // The real field-level override the `comments` plugin ships. Wiring only THIS
        // field (rather than the whole workspace via `form.components.field`) keeps every
        // other story in this file unaffected  -  `CommentsField` reads `useCommentsEnabled()`
        // and bails to `renderDefault` whenever that context is not seeded, which is the
        // default everywhere except the two `CommentsWired*` stories below.
        components: {field: CommentsField},
      },
    ],
  },
  {
    name: 'ptArticle',
    title: 'PT article',
    type: 'document',
    fields: [{name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]}],
  },
]

const meta: Meta = {
  title: 'Forms & Input/Portable Text Shell',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          '`BlockActions` is doubly deprecated and never wired from schema options anywhere in ' +
            'the codebase, and the comments dispatcher has its own quiet failure mode: a Portable ' +
            'Text field with the comments plugin installed can still silently fall back to the ' +
            'plain editor if one sibling component never got wired at the schema-field level.',
          '',
          '| | |',
          '|---|---|',
          '| Source | top-level `PortableText/`: `BlockActions.tsx`, `InvalidValue.tsx`; comments: `comments/plugin/input/CommentsInput.tsx`, `comments/plugin/input/components/{CommentsPortableTextInput,FloatingButtonPopover,InlineCommentInputPopover}.tsx`; diff: `field/types/portableText/diff/components/PortableText.tsx` |',
          '| Tier | SERVICE. None of this is the editor itself (CORE, storied separately); it is the chrome and integration seams around it |',
          '| Audit | ⚪ not individually audited. Two structural findings surfaced while building this page (below) |',
          '',
          'The machinery underneath the Portable Text editor page (`Forms & Input/PortableText`) ' +
            'rather than the editor itself: the block-actions slot, the invalid-value recovery ' +
            'banner, the comments-input dispatcher and its two popovers, and the single entry ' +
            'point that draws a Portable Text field diff. The other two top-level exports mounted ' +
            'here are `Compositor`/`Editor`, exercised through the real `PortableTextInput` rather ' +
            'than in isolation (see the note below).',
          '',
          '`Compositor` and `Editor` are not mounted directly. Both are internal composition ' +
            'layers: `Compositor` registers the block/inline/annotation node renderers against ' +
            'the live `@portabletext/editor` machine (`useEditor()`), and `Editor` is the ' +
            'toolbar-plus-editable shell inside it. Neither has a state that is not already ' +
            'reachable through the real `PortableTextInput` (`Forms & Input/PortableText`), and ' +
            'reproducing their ancestor stack (the schema-derived node plugins, ' +
            '`PortableTextMemberSchemaTypesProvider`, the editor session) would mean rebuilding ' +
            '`PortableTextInput` itself rather than exercising it. The two questions the brief ' +
            'asked about them are answered here in prose, against the real source:',
          '',
          '- **Fullscreen vs inline:** `isFullscreen` is a single boolean thread through both ' +
            'components (`Compositor.tsx`, `Editor.tsx`). It changes which DOM portal the editor ' +
            'mounts into (`expanded` vs `collapsed`, `Compositor.tsx:596-597`), the boundary ' +
            "element popovers clip to, and the toolbar's padding/collapsibility, but every " +
            'affordance (style select, decorators, insert menu, block actions) is present in both ' +
            'modes. Nothing is fullscreen-only or inline-only.',
          "- **Resolving vs empty:** `PortableTextInput.tsx` sets a `ready` flag on the editor's " +
            "`'ready'` event (`useState(false)` at line 173, `setReady(true)` at line 330) and " +
            'uses it for exactly one thing: forcing `readOnly` true until it fires ' +
            '(`readOnly || !ready`, lines 418/430/447). There is no loading placeholder, spinner, ' +
            'or skeleton: the editor mounts its full toolbar and editable surface immediately, in ' +
            'the same shape it has once ready, and silently rejects input until the flag flips. An ' +
            'empty *not-yet-ready* document and an empty *ready* document render byte-identical ' +
            'DOM. This is the pattern the brief asked about directly: a state that renders as ' +
            'ordinary content instead of announcing itself; here the "not ready yet" state is not ' +
            'a failure, but it is invisible.',
          '',
          '**Comments: the dispatcher and the gate it depends on.** `CommentsInput` (installed ' +
            'globally here as `form.components.input`, exactly as the `comments` plugin registers ' +
            'it) is a two-way dispatcher on `isArrayOfBlocksSchemaType(schemaType)`: a ' +
            'non-Portable-Text field always falls through to `renderDefault`. A Portable Text ' +
            'field routes to `CommentsPortableTextInput`, which has its own three-part gate ' +
            '(`enabled`, not the AI-Assist prompt type, and ' +
            '`Boolean(fieldActions.__internal_comments)`). The third condition is set by a ' +
            '*sibling* component, `CommentsField` (`comments/plugin/field/CommentsField.tsx`), ' +
            'which threads `__internal_comments` into the field props only when comments are ' +
            'enabled for that field. Without `CommentsField` wired at the schema-field level, a ' +
            'Portable Text field with the comments plugin installed still silently falls back to ' +
            'the plain editor (`DispatchPortableTextFieldUnwired` below reproduces this honestly, ' +
            'on a document type that does not have `CommentsField` attached). `commentsPost.body` ' +
            'carries it, scoped to that one field so no other story in this file is affected.',
          '',
          '> **Why it matters:** `BlockActions` is doubly deprecated, the component itself ' +
            '("`renderBlockActions`… will be removed in the next major version", ' +
            '`inputProps.ts:583`) and the hook it is built on (`usePortableTextEditor`, ' +
            '`"@deprecated Use useEditor"`). It is also never wired from schema options anywhere ' +
            'in `packages/sanity`: a grep across the source finds no caller that sets ' +
            '`renderBlockActions` outside the type definitions and this component chain, so the ' +
            'only way to reach it in a real Studio is a custom `form.components.input` wrapper ' +
            'that supplies the callback itself.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {
        schema: {name: 'storybook', types: schemaTypes},
        form: {components: {input: CommentsInput}},
      },
    }),
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:forms',
    'pattern:block-editor-authoring',
    'pattern:collaborative-presence',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

// ---------------------------------------------------------------------------
// BlockActions  -  deprecated, never schema-wired, requires only an editor session
// ---------------------------------------------------------------------------

const blockActionsSchema = defineSchema({})

const demoBlockText = 'A paragraph with block actions.'

const demoBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'demoBlock',
  style: 'normal',
  markDefs: [],
  children: [{_type: 'span', _key: 'demoBlockSpan', text: demoBlockText}],
}

// oxlint-disable-next-line no-deprecated -- matches real usage in packages/sanity/src/core/form/inputs/PortableText/Compositor.tsx; not yet migrated anywhere in the real Studio source
function BlockActionsHost(props: {renderBlockActions?: RenderBlockActionsCallback}) {
  return (
    <Box padding={4} style={{maxWidth: 480}}>
      <Card border padding={3} radius={2}>
        <Stack gap={3}>
          <Text size={1}>{demoBlockText}</Text>
          <EditorProvider
            initialConfig={{schemaDefinition: blockActionsSchema, initialValue: [demoBlock]}}
          >
            <BlockActions
              block={demoBlock}
              onChange={() => undefined}
              renderBlockActions={props.renderBlockActions}
            />
          </EditorProvider>
        </Stack>
      </Card>
    </Box>
  )
}

/**
 * `if (!blockActions) return null`  -  the default in every real Studio, since nothing
 * calls `renderBlockActions` from schema options. Nothing renders below the paragraph.
 */
export const BlockActionsEmpty: Story = {
  name: 'BlockActions: no callback (renders null)',
  render: () => <BlockActionsHost />,
}

/**
 * With a `renderBlockActions` callback supplied (the only way this component is ever
 * reached), it wraps the callback's return value in a `contentEditable={false}` div  -  a
 * pin and a delete button here, standing in for what a plugin's callback might return.
 */
export const BlockActionsWithCallback: Story = {
  name: 'BlockActions: with callback',
  render: () => (
    <BlockActionsHost
      renderBlockActions={() => (
        <Flex gap={1}>
          <Button mode="bleed" fontSize={1} padding={2} text="Pin" />
          <Button mode="bleed" tone="critical" fontSize={1} padding={2} text="Delete" />
        </Flex>
      )}
    />
  ),
}

// ---------------------------------------------------------------------------
// The shell: Compositor + Editor, exercised through the real PortableTextInput
// ---------------------------------------------------------------------------

const shellBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'shellBlk1',
    style: 'h2',
    markDefs: [],
    children: [{_type: 'span', _key: 'shellBlk1s', text: 'The editor shell'}],
  },
  {
    _type: 'block',
    _key: 'shellBlk2',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'shellBlk2s',
        text: 'Toggle fullscreen with the toolbar button  -  the editable surface and every toolbar affordance stay the same; only the portal, the boundary and the padding change.',
      },
    ],
  },
]

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

/**
 * The first real DOM Text node under `root`, depth-first. `[data-text]`'s own `firstChild` is
 * NOT reliably a text node - for this story's block (a real `text-block__text` render, not the
 * bare span the simpler `AnnotationLink`/action-menu play functions select in) it is a wrapper
 * `<div data-ui="Text">` several levels above the actual text, and `setBaseAndExtent` on an
 * ELEMENT node reads its offset arguments as a CHILD INDEX, not a character count. Selecting the
 * wrapper div at offsets 0 and 6 threw "IndexSizeError: there is no child at offset 6", because
 * that wrapper does not have 6 children - it has one or two. Walking to the actual text node
 * fixes the shape mismatch; clamping the end offset to its real length keeps this safe even if
 * the fixture text is ever shortened.
 */
// `globalThis.Text` (not the bare `Text`), because `@sanity/ui`'s `Text` component is imported
// into this module's scope above and shadows the ambient DOM `Text` interface by that name.
function findFirstTextNode(root: Node): globalThis.Text | null {
  if (root.nodeType === Node.TEXT_NODE) {
    return root as globalThis.Text
  }
  for (const child of Array.from(root.childNodes)) {
    const found = findFirstTextNode(child)
    if (found) return found
  }
  return null
}

/** The collapsed (inline) shell: default mount, no play. */
export const ShellInline: Story = {
  name: 'Shell: inline (collapsed)',
  render: () => (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType="shellPost"
        initialDocument={{body: shellBody}}
        height={320}
      />
    </Box>
  ),
}

/**
 * Same document, same component tree  -  the play function clicks the real
 * `fullscreen-button-expand` toolbar button (`Toolbar.tsx:143-147`). Compare the two
 * canvases: the toolbar, the style/decorator/insert affordances and the placeholder
 * text are identical, only the layout and the portal target differ.
 */
export const ShellFullscreen: Story = {
  name: 'Shell: fullscreen (expanded)',
  render: () => (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType="shellPost"
        initialDocument={{body: shellBody}}
        height={320}
      />
    </Box>
  ),
  play: async ({canvasElement}) => {
    const trigger = await waitForElement(canvasElement, '[data-testid="fullscreen-button-expand"]')
    trigger.click()
  },
}

// ---------------------------------------------------------------------------
// InvalidValue  -  a pure renderer; the resolution IS its own input
// ---------------------------------------------------------------------------

function makeResolution(overrides: Partial<InvalidValueResolution> = {}): InvalidValueResolution {
  return {
    patches: [],
    description: 'Text block with key `blk1` is missing the `markDefs` property.',
    action: 'Add property',
    item: undefined,
    i18n: {
      description: 'inputs.portable-text.invalid-value.missing-or-invalid-markdefs.description',
      action: 'inputs.portable-text.invalid-value.missing-or-invalid-markdefs.action',
      values: {key: 'blk1'},
    },
    ...overrides,
  }
}

function InvalidValueHost(props: {resolution: InvalidValueResolution; readOnly?: boolean}) {
  return (
    <Box padding={4} style={{maxWidth: 480}}>
      <InvalidValue
        onChange={() => undefined}
        onIgnore={() => undefined}
        resolution={props.resolution}
        readOnly={props.readOnly}
      />
    </Box>
  )
}

/**
 * The common case: a real, existing i18n key (`missing-or-invalid-markdefs`, one of
 * the editor's actual invalid-value kinds) with an action  -  both "Ignore" and the
 * resolving action button show, plus the disclaimer text and a JSON preview of the
 * offending item.
 */
export const InvalidValueEditable: Story = {
  name: 'InvalidValue: resolvable, editable',
  render: () => <InvalidValueHost resolution={makeResolution()} />,
}

/**
 * Same resolution, `readOnly`. `{!readOnly && <Button onClick={handleAction} .../>}`
 * hides the resolving action; "Ignore" still shows since it only depends on
 * `resolution.action` being truthy.
 */
export const InvalidValueReadOnly: Story = {
  name: 'InvalidValue: resolvable, read only',
  render: () => <InvalidValueHost resolution={makeResolution()} readOnly />,
}

/**
 * `resolution.action` empty: `{resolution.action && <Grid>...</Grid>}` and the
 * disclaimer both gate on it, so neither renders  -  only the description and the JSON
 * preview. This state is hand-constructed to reach the branch (every kind the real
 * editor emits currently ships with an action); it is evidence about the code path,
 * not a claim that an action-less resolution occurs in practice today.
 */
export const InvalidValueNoAction: Story = {
  name: 'InvalidValue: no action (branch reproduction)',
  render: () => <InvalidValueHost resolution={makeResolution({action: ''})} />,
}

// ---------------------------------------------------------------------------
// CommentsInput  -  the dispatcher (real schemaType, real renderDefault chain)
// ---------------------------------------------------------------------------

/**
 * A plain string field: `isArrayOfBlocksSchemaType` is false, so `CommentsInput`
 * dispatches straight to `props.renderDefault(props)`  -  the ordinary `StringInput`,
 * completely untouched.
 */
export const DispatchNonPortableTextField: Story = {
  name: 'CommentsInput: non-Portable-Text field (renderDefault)',
  render: () => (
    <Box padding={3} style={{maxWidth: 480}}>
      <FormBuilderHarness
        documentType="dispatchPost"
        initialDocument={{title: 'A title field, dispatched through CommentsInput'}}
      />
    </Box>
  ),
}

/**
 * A Portable Text field on `dispatchPost`, which does NOT carry the `CommentsField`
 * component override. `CommentsInput` correctly routes here to `CommentsPortableTextInput`
 * (`isArrayOfBlocksSchemaType` is true)  -  but that component's own gate
 * (`Boolean(fieldActions.__internal_comments)`) is false without `CommentsField`, so it
 * ALSO falls back to `renderDefault`. The result is indistinguishable from a studio that
 * never installed the comments plugin at all: the real behaviour when only half the
 * integration is wired.
 */
export const DispatchPortableTextFieldUnwired: Story = {
  name: 'CommentsInput: Portable Text field, comments not field-wired (renderDefault)',
  render: () => (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType="dispatchPost"
        initialDocument={{
          body: [
            {
              _type: 'block',
              _key: 'dispatchBlk',
              style: 'normal',
              markDefs: [],
              children: [
                {_type: 'span', _key: 'dispatchBlkS', text: 'No comment affordance appears here.'},
              ],
            },
          ],
        }}
        height={220}
      />
    </Box>
  ),
}

// ---------------------------------------------------------------------------
// CommentsPortableTextInput, wired  -  the singleton contexts are value-seeded
// (mirrors the TasksStoryHarness pattern in lib/mockCollabFixtures.tsx), never
// reconstructing the real CommentsProvider's live document-store subscription.
// ---------------------------------------------------------------------------

function makeSeededCommentsValue(): CommentsContextValue {
  return {
    documentId: 'commentsPost-demo',
    documentType: 'commentsPost',
    getComment: () => undefined,
    isCreatingDataset: false,
    comments: {data: {open: [], resolved: []}, error: null, loading: false},
    operation: {
      create: async () => undefined,
      remove: async () => undefined,
      update: async () => undefined,
      react: async () => undefined,
    },
    mentionOptions: fixtureMentionOptions,
    status: 'open',
    setStatus: () => undefined,
  }
}

/**
 * Value-seeds the four Comments singleton contexts `CommentsPortableTextInput` (via
 * `CommentsField`/`CommentsInput`) reads, instead of mounting the real `CommentsProvider`
 * (which needs a live `useEditState` document-store subscription and a realtime addon
 * dataset store  -  neither reachable from a story). `CommentsUpsellContext` is left
 * unseeded: `useCommentsUpsell()` returns a graceful dummy value without one.
 */
const enabledValue = {enabled: true, mode: 'default'} as const

function CommentsWiredHarness(props: {children: ReactNode}) {
  const [selectedPath, setSelectedPath] = useState<CommentsSelectedPath | null>(null)
  const [authoringPath, setAuthoringPath] = useState<string | null>(null)
  const commentsValue = useMemo(() => makeSeededCommentsValue(), [])
  const selectedPathValue = useMemo(() => ({selectedPath, setSelectedPath}), [selectedPath])
  const authoringPathValue = useMemo(() => ({authoringPath, setAuthoringPath}), [authoringPath])
  return (
    <CommentsEnabledContext.Provider value={enabledValue}>
      <CommentsContext.Provider value={commentsValue}>
        <CommentsSelectedPathContext.Provider value={selectedPathValue}>
          <CommentsAuthoringPathContext.Provider value={authoringPathValue}>
            {props.children}
          </CommentsAuthoringPathContext.Provider>
        </CommentsSelectedPathContext.Provider>
      </CommentsContext.Provider>
    </CommentsEnabledContext.Provider>
  )
}

const commentsWiredBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'commentsBlk',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'commentsBlkS',
        text: 'Select this sentence to see the real add-comment button appear.',
      },
    ],
  },
]

/**
 * The fully wired field (`commentsPost.body`, real `CommentsField` + `CommentsInput` +
 * seeded contexts): no comments yet, ordinary editable text, no popover  -  the resting
 * state before any selection.
 */
export const CommentsWiredEmpty: Story = {
  name: 'CommentsPortableTextInput: wired, no comments yet',
  render: () => (
    <CommentsWiredHarness>
      <Box padding={3} style={{maxWidth: 640}}>
        <FormBuilderHarness
          documentType="commentsPost"
          initialDocument={{body: commentsWiredBody}}
          height={220}
        />
      </Box>
    </CommentsWiredHarness>
  ),
}

/**
 * The play function selects a real text range in the live editor (the same
 * `window.getSelection().setBaseAndExtent` pattern `PortableTextInput.stories.tsx`'s
 * `AnnotationLink` story uses)  -  driving `CommentsPortableTextInputInner`'s own
 * `handleSelectionChange` for real. The result is the real `FloatingButtonPopover`,
 * mounted by the real component in response to a real selection, not a hand-placed prop.
 *
 * CORRECTED (2026-07-30): this used to select `([data-text]'s firstChild, 0, ..., 6)` on the
 * assumption that `firstChild` was the text node itself, the same shape the collapsed-cursor
 * plays elsewhere on this page and in `PortableTextInput.stories.tsx` get away with because they
 * only ever ask for offset 0 or 1. A genuine 6-character range exposed the assumption: live in
 * this block's real DOM, `[data-text]`'s `firstChild` is a wrapper `<div data-ui="Text">`, several
 * levels above the actual text node, and `setBaseAndExtent` on an ELEMENT reads its offset as a
 * child index, not a character count - `IndexSizeError: no child at offset 6`, because that
 * wrapper has nowhere near 6 children. `findFirstTextNode` walks to the real text node instead of
 * assuming its position, and the end offset is clamped to that node's own length so this keeps
 * working even if the fixture text is ever shortened below 6 characters.
 */
export const CommentsWiredSelecting: Story = {
  name: 'CommentsPortableTextInput: wired, text selected (real add-comment button)',
  render: () => (
    <CommentsWiredHarness>
      <Box padding={3} style={{maxWidth: 640}}>
        <FormBuilderHarness
          documentType="commentsPost"
          initialDocument={{body: commentsWiredBody}}
          height={220}
        />
      </Box>
    </CommentsWiredHarness>
  ),
  play: async ({canvasElement}) => {
    const editable = await waitForElement(
      canvasElement,
      '[data-testid="pt-editor"] [contenteditable="true"]',
    )
    const dataText = editable.querySelector('[data-text]') ?? editable
    const textNode = findFirstTextNode(dataText)
    if (textNode) {
      const end = Math.min(6, textNode.length)
      editable.focus()
      window.getSelection()?.setBaseAndExtent(textNode, 0, textNode, end)
      editable.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}))
    }
  },
}

// ---------------------------------------------------------------------------
// FloatingButtonPopover / InlineCommentInputPopover  -  pure renderers, storied
// standalone (their own props are their own input; no editor session needed).
// ---------------------------------------------------------------------------

function AnchoredPopoverHost(props: {children: (anchor: HTMLElement | null) => ReactNode}) {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  return (
    <Box padding={4} style={{maxWidth: 420, minHeight: 160}}>
      <Card border padding={3} radius={2}>
        <Box ref={setAnchor}>
          <Text size={1}>Selected sentence, the popover anchors here.</Text>
        </Box>
        {props.children(anchor)}
      </Card>
    </Box>
  )
}

/** The default state: enabled, no overlapping decoration. */
export const FloatingButtonEnabled: Story = {
  name: 'FloatingButtonPopover: enabled',
  render: () => (
    <AnchoredPopoverHost>
      {(anchor) => (
        <FloatingButtonPopover
          disabled={false}
          onClick={() => undefined}
          onClickOutside={() => undefined}
          referenceElement={anchor}
        />
      )}
    </AnchoredPopoverHost>
  ),
}

/**
 * `disabled`: the real fallback icon and copy (`CommentDisabledIcon`, the
 * "overlap" tooltip text)  -  reached in the real component whenever the current
 * selection overlaps an existing comment's range, or the addon dataset failed to load.
 */
export const FloatingButtonDisabledOverlap: Story = {
  name: 'FloatingButtonPopover: disabled (overlapping selection)',
  render: () => (
    <AnchoredPopoverHost>
      {(anchor) => (
        <FloatingButtonPopover
          disabled
          onClick={() => undefined}
          onClickOutside={() => undefined}
          referenceElement={anchor}
        />
      )}
    </AnchoredPopoverHost>
  ),
}

/** Empty composer, freshly opened. */
export const InlineInputEmpty: Story = {
  name: 'InlineCommentInputPopover: empty',
  render: () => (
    <AnchoredPopoverHost>
      {(anchor) => (
        <InlineCommentInputPopover
          currentUser={currentUserDoug}
          mentionOptions={fixtureMentionOptions}
          onChange={() => undefined}
          onClickOutside={() => undefined}
          onDiscardConfirm={() => undefined}
          onSubmit={() => undefined}
          referenceElement={anchor}
          value={null}
        />
      )}
    </AnchoredPopoverHost>
  ),
}

/** Pre-filled with a message ending in a resolved `@mention` chip, mirroring the
 * `CommentInput` story's `WithValue` fixture. */
export const InlineInputWithMention: Story = {
  name: 'InlineCommentInputPopover: with value + mention',
  render: () => (
    <AnchoredPopoverHost>
      {(anchor) => (
        <InlineCommentInputPopover
          currentUser={currentUserDoug}
          mentionOptions={fixtureMentionOptions}
          onChange={() => undefined}
          onClickOutside={() => undefined}
          onDiscardConfirm={() => undefined}
          onSubmit={() => undefined}
          referenceElement={anchor}
          value={[
            {
              _type: 'block',
              _key: 'inlinePopoverMsg',
              style: 'normal',
              markDefs: [],
              children: [
                {_type: 'span', _key: 'inlinePopoverMsgS0', text: 'Assigning this to', marks: []},
                {_type: 'span', _key: 'inlinePopoverMsgS1', text: ' ', marks: []},
                {_type: 'mention', _key: 'inlinePopoverMsgM0', userId: 'octavia'},
                {_type: 'span', _key: 'inlinePopoverMsgS2', text: '', marks: []},
              ],
            },
          ]}
        />
      )}
    </AnchoredPopoverHost>
  ),
}

// ---------------------------------------------------------------------------
// The Portable Text diff renderer  -  the diff IS computed, never hand-authored.
// Mirrors `field/types/portableText/diff/PTDiff.tsx`, the real registered entry
// point, which is four lines of glue around `createPortableTextDiff` + this
// component: `useSchema()` for the block's compiled schema type, `diffInput(wrap(...))`
// from `@sanity/diff` for the block-level diff, `createPortableTextDiff` to shape it.
// ---------------------------------------------------------------------------

function PortableTextDiffDemo(props: {from: PortableTextBlock; to: PortableTextBlock}) {
  const schema = useSchema()
  const articleType = schema.get('ptArticle') as ObjectSchemaType
  const bodyField = articleType.fields.find((f) => f.name === 'body')
  const bodyArrayType = bodyField?.type as ArraySchemaType
  const blockSchemaType = bodyArrayType.of[0] as ObjectSchemaType

  const blockDiff = diffInput(
    wrap(props.from, {author: 'ada'}),
    wrap(props.to, {author: 'ada'}),
  ) as ObjectDiff
  const ptDiff = createPortableTextDiff(blockDiff, blockSchemaType)

  return (
    <Box padding={4} style={{maxWidth: 560}}>
      <PortableTextDiffView diff={ptDiff} schemaType={blockSchemaType} />
    </Box>
  )
}

function block(
  text: string,
  options: {style?: string; marks?: string[]; markDefs?: unknown[]} = {},
) {
  const {style = 'normal', marks = [], markDefs = []} = options
  return {
    _type: 'block',
    _key: 'diffBlk',
    style,
    markDefs,
    children: [{_type: 'span', _key: 'diffBlkS', text, marks}],
  } as PortableTextBlock
}

/** A word-level text edit inside an otherwise unchanged sentence  -  real diff-match-patch
 * segmentation, not a hand-drawn strikethrough. */
export const DiffTextEdited: Story = {
  name: 'PortableText diff: text edited',
  render: () => (
    <PortableTextDiffDemo
      from={block('The launch date is set for September.')}
      to={block('The launch date is confirmed for late September.')}
    />
  ),
}

/** A decorator (`strong`) added to part of an unchanged sentence  -  exercises the
 * diff `Decorator` renderer. */
export const DiffMarkAdded: Story = {
  name: 'PortableText diff: decorator added',
  render: () => (
    <PortableTextDiffDemo
      from={block('Ship structured content, not another page builder.')}
      to={block('Ship structured content', {marks: ['strong']})}
    />
  ),
}

/** A heading-style change on the same text  -  exercises the diff `Header`/`Style`
 * renderers. */
export const DiffStyleChanged: Story = {
  name: 'PortableText diff: style changed',
  render: () => (
    <PortableTextDiffDemo
      from={block('The quiet rise of structured content')}
      to={block('The quiet rise of structured content', {style: 'h2'})}
    />
  ),
}

// ---------------------------------------------------------------------------
// In context
// ---------------------------------------------------------------------------

/**
 * In context: the ordinary shell, editing a short note  -  the ground state every other
 * story on this page varies away from (a deprecated action slot, an invalid-value
 * recovery banner, a comments popover, a diff). No decoration, no popover, no gate.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType="shellPost"
        initialDocument={{
          body: [
            {
              _type: 'block',
              _key: 'inContextBlk',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: 'inContextBlkS',
                  text: 'An ordinary paragraph, in an ordinary editor, with none of the seams above engaged.',
                },
              ],
            },
          ],
        }}
        height={220}
      />
    </Box>
  ),
}
