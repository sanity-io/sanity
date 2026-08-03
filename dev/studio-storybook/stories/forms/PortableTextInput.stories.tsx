import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {ImageIcon} from '@sanity/icons/Image'
import {RedoIcon} from '@sanity/icons/Redo'
import {UndoIcon} from '@sanity/icons/Undo'
import {type PortableTextBlock, type Rule, type SchemaTypeDefinition} from '@sanity/types'
import {Badge, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Schema: a `post` document whose `body` is a Portable Text array with every member
 * kind the editor supports:
 * - `block` with the DEFAULT styles/lists/decorators/link-annotation, plus an inline
 *   `mention` object (`block.of`)
 * - `callout`, a block-level object with a preview and a required `heading` (so the
 *   harness's real `validateDocument` can mark a child block)
 * - `legacyImage`, titled "Image", carrying `deprecated: {reason}`: the real
 *   `InsertMenu` renders it disabled with the reason as hover-only tooltip
 *   (`toolbar/InsertMenu.tsx`), which is the `governance-deprecation` audit surface.
 *
 * `postReadOnly` duplicates the field with schema-level `readOnly: true`; the harness
 * has no readOnly prop, and the schema route exercises the same member state the
 * document pane produces.
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
    icon: BulbOutlineIcon,
    fields: [
      {
        name: 'heading',
        title: 'Heading',
        type: 'string',
        validation: (rule: Rule) => rule.required(),
      },
      {name: 'note', title: 'Note', type: 'text'},
    ],
    preview: {select: {title: 'heading', subtitle: 'note'}},
  },
  {
    name: 'legacyImage',
    title: 'Image',
    type: 'object',
    icon: ImageIcon,
    deprecated: {reason: 'Use the Callout block instead'},
    fields: [{name: 'caption', title: 'Caption', type: 'string'}],
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
        of: [{type: 'block', of: [{type: 'mention'}]}, {type: 'callout'}, {type: 'legacyImage'}],
      },
    ],
  },
  {
    name: 'postReadOnly',
    title: 'Post (read only)',
    type: 'document',
    fields: [
      {
        name: 'body',
        title: 'Body',
        type: 'array',
        readOnly: true,
        of: [{type: 'block', of: [{type: 'mention'}]}, {type: 'callout'}],
      },
    ],
  },
  // The in-context host: a real article document whose Portable Text Body sits beside a
  // plain Title, so the editor reads as one field of a document being written.
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {
        name: 'body',
        title: 'Body',
        type: 'array',
        of: [{type: 'block', of: [{type: 'mention'}]}, {type: 'callout'}, {type: 'legacyImage'}],
      },
    ],
  },
]

interface SpanSpec {
  text: string
  marks?: string[]
}

interface BlockOptions {
  style?: string
  listItem?: 'bullet' | 'number'
  level?: number
  markDefs?: {_key: string; _type: string; [prop: string]: unknown}[]
}

let keyCounter = 0
function block(spans: SpanSpec[], options: BlockOptions = {}): PortableTextBlock {
  keyCounter += 1
  return {
    _type: 'block',
    _key: `blk${keyCounter}`,
    style: options.style ?? 'normal',
    ...(options.listItem ? {listItem: options.listItem, level: options.level ?? 1} : {}),
    markDefs: options.markDefs ?? [],
    children: spans.map((span, index) => ({
      _type: 'span',
      _key: `blk${keyCounter}s${index}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
  }
}

/** Headings, decorated paragraphs, a blockquote and both list kinds. */
const populatedBody: PortableTextBlock[] = [
  block([{text: 'The block editor'}], {style: 'h2'}),
  block([
    {text: 'Portable Text stores rich text as '},
    {text: 'typed blocks', marks: ['strong']},
    {text: ', every paragraph, heading and object is '},
    {text: 'addressable data', marks: ['em']},
    {text: ', queryable as '},
    {text: 'body[]', marks: ['code']},
    {text: '.'},
  ]),
  block([{text: 'Structure you can see is structure you can trust.'}], {style: 'blockquote'}),
  block([{text: 'Blocks carry their style'}], {listItem: 'bullet'}),
  block([{text: 'Spans carry their marks'}], {listItem: 'bullet'}),
  block([{text: 'Author'}], {listItem: 'number'}),
  block([{text: 'Publish'}], {listItem: 'number'}),
]

const blockObjectBody: PortableTextBlock[] = [
  block([{text: 'A block-level object sits in the text flow as a first-class block:'}]),
  {
    _type: 'callout',
    _key: 'callout1',
    heading: 'Ship structured content',
    note: 'Objects in the body render through their schema preview.',
  },
  block([{text: 'Text continues after it, select, move or delete it like any block.'}]),
]

const inlineObjectBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'inlineblk',
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'in0', text: 'Reviewed with ', marks: []},
      {_type: 'mention', _key: 'in1', userName: 'Ada Lovelace'},
      {_type: 'span', _key: 'in2', text: ' before publishing.', marks: []},
    ],
  },
]

const annotationBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'annblk',
    style: 'normal',
    markDefs: [{_key: 'link1', _type: 'link', href: 'https://www.sanity.io'}],
    children: [
      {_type: 'span', _key: 'an0', text: 'Read the docs at ', marks: []},
      {_type: 'span', _key: 'an1', text: 'sanity.io', marks: ['link1']},
      {_type: 'span', _key: 'an2', text: ' for the full model.', marks: []},
    ],
  },
]

/** The callout is missing its required `heading` → a real child validation marker. */
const invalidBody: PortableTextBlock[] = [
  block([{text: 'The callout below fails its schema rule:'}]),
  {_type: 'callout', _key: 'invalidCallout', note: 'No heading was entered.'},
]

/**
 * The harness suspends while the mock workspace compiles, so play functions poll for
 * their trigger before acting. Plain DOM, no interaction-test dependency.
 */
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
 * The style-select and insert controls are disabled until the editor holds a
 * selection (the real toolbar behaviour), so menu-opening plays place the caret at
 * the start of the first text span before reaching for their trigger.
 */
async function placeCaretInEditor(root: HTMLElement): Promise<void> {
  const editable = await waitForElement(root, '[data-testid="pt-editor"] [contenteditable="true"]')
  editable.focus()
  const textNode = editable.querySelector('[data-text]')?.firstChild ?? editable.firstChild
  if (textNode) {
    window.getSelection()?.setBaseAndExtent(textNode, 0, textNode, 0)
  }
}

const meta: Meta = {
  title: 'Forms & Input/PortableText',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Where most editors hand an author a soup of HTML, Portable Text keeps rich text as ' +
            'typed, addressable blocks: every paragraph, heading, list item and embedded object ' +
            'is real data, queryable and renderable however each channel needs, with a familiar ' +
            'toolbar sitting on top so nothing about writing it feels different.',
          '',
          '| | |',
          '|---|---|',
          '| Tier | CORE. The decomposition map’s one true resident: rich text as typed, addressable blocks is the content-model machinery itself, with no design-system equivalent (its chrome was a Carbon 🔴 Gap) |',
          '| Audit | 🔴 needs-work (`block-editor-authoring`, `governance-deprecation`). The toolbar collapses responsively and undo steps back operations correctly, but undo/redo is keyboard-only with no on-screen affordance, inserting an object mid-block silently splits it into fragments, and a deprecated "Image" insert control renders near-identically to live ones with its reason hover-only |',
          '| Patterns | `block-editor-authoring` · `governance-deprecation` |',
          '',
          'Studio’s rich-text editor: the one that stores formatting as structured, queryable ' +
            'blocks instead of an HTML blob, and lets you drop custom objects right into the ' +
            'prose. No design system ships anything like it; its chrome was a Carbon 🔴 Gap.',
          '',
          'Every story here mounts the **real** `PortableTextInput` at full depth: ' +
            '`lib/formBuilderHarness.tsx` (the `TestForm` port) runs a live `FormBuilder` over the ' +
            'schema, so the editor arrives as a real resolved form member: real toolbar, real ' +
            '`@portabletext/editor` contenteditable that accepts typing, real block/inline objects ' +
            'through their previews, real `validateDocument` markers. This is the same mount ' +
            "`packages/sanity`'s own PT browser tests use (`__tests__/InputStory.tsx` → " +
            '`TestWrapper` + `TestForm`).',
          '',
          'The two-variant audit stories sit at the end: `Current` states are the unmodified ' +
            'component; `Recommended` states are prop-driven compositions of `@sanity/ui` ' +
            'primitives illustrating the resolved affordance.',
          '',
          '> **Why it matters:** inserting a block object mid-paragraph **silently splits that ' +
            'paragraph into two blocks**, no warning, and undo is keyboard-only with no on-screen ' +
            'affordance. It is the sharpest edge in the editor, and the one the ' +
            '`block-editor-authoring` audit most wants softened.',
          '',
          'The page closes **in context**: the block editor as the Body of an "Anna Karenina" ' +
            'article being written, headings, decorated prose, a blockquote and a callout, beside ' +
            'the document Title.',
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
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:forms',
    'pattern:block-editor-authoring',
    'pattern:governance-deprecation',
    'audit:needs-work',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

function PostEditor(props: {
  body?: PortableTextBlock[]
  documentType?: string
  maxWidth?: number
  height?: number
}) {
  const {body, documentType = 'post', maxWidth = 640, height = 420} = props
  return (
    <Box padding={3} style={{maxWidth}}>
      <FormBuilderHarness
        documentType={documentType}
        initialDocument={body ? {body} : undefined}
        height={height}
      />
    </Box>
  )
}

/**
 * The empty editor: toolbar (style select, decorators, link, insert buttons) over an
 * activated contenteditable showing the **"Empty"** placeholder. The editor is live:
 * click in and type.
 */
export const Empty: Story = {
  render: () => <PostEditor />,
}

/**
 * A populated document exercising the text spine: `h2` heading, a paragraph carrying
 * **strong**, *em* and `code` spans, a blockquote, and bullet + numbered lists. All of
 * it is real editor state; place the caret anywhere and edit.
 */
export const Populated: Story = {
  render: () => <PostEditor body={populatedBody} />,
}

/**
 * A `callout` object block in the flow: it renders through its schema `preview`
 * (title + subtitle + icon) inside the block frame, between editable text blocks.
 * Hovering the block reveals its manipulation affordances (open/edit/delete via the
 * block menu), hover-reveal being exactly what the `block-editor-authoring` audit
 * flags for discoverability.
 */
export const BlockObject: Story = {
  name: 'Block object (callout)',
  render: () => <PostEditor body={blockObjectBody} />,
}

/**
 * An inline `mention` object inside a text block: it flows with the line, rendered
 * through its preview as a chip between spans. Click it to open its editing surface.
 */
export const InlineObject: Story = {
  name: 'Inline object (mention)',
  render: () => <PostEditor body={inlineObjectBody} />,
}

/**
 * A link annotation on the span "sanity.io". The play function places the caret
 * inside the annotated span, which raises the real annotation toolbar popover
 * (edit / remove), the same popover a caret placed by clicking produces.
 */
export const AnnotationLink: Story = {
  name: 'Annotation (link) with popover',
  render: () => <PostEditor body={annotationBody} />,
  play: async ({canvasElement}) => {
    const link = await waitForElement(canvasElement, 'span[data-link]')
    const textNode = link.querySelector('[data-text]')?.firstChild ?? link.firstChild
    if (textNode) {
      link.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      window.getSelection()?.setBaseAndExtent(textNode, 1, textNode, 1)
      link.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}))
    }
  },
}

/**
 * The block-style menu open: the real `BlockStyleSelect` popover listing the schema's
 * styles (Normal, H1–H6, Quote) with their rendered previews. Opened by the play
 * function clicking the toolbar's style select.
 */
export const BlockStyleMenuOpen: Story = {
  name: 'Block-style menu (open)',
  render: () => <PostEditor body={populatedBody} />,
  play: async ({canvasElement}) => {
    await placeCaretInEditor(canvasElement)
    const trigger = await waitForElement(
      canvasElement,
      '[data-testid="block-style-select"] button:not([disabled])',
    )
    trigger.click()
  },
}

/**
 * The insert menu open, in the collapsed state: at narrow widths the real
 * `CollapseMenu` folds the insert buttons into an overflow menu. The play function
 * opens it, showing **Callout** (live) and **Image** (deprecated, disabled) as menu
 * items. Compare with the governance stories below for the same surface uncollapsed.
 */
export const InsertMenuOpen: Story = {
  name: 'Insert menu (open, collapsed)',
  render: () => <PostEditor maxWidth={360} />,
  play: async ({canvasElement}) => {
    await placeCaretInEditor(canvasElement)
    const trigger = await waitForElement(
      canvasElement,
      '[data-testid="insert-menu-button"]:not([disabled])',
    )
    trigger.click()
  },
}

/**
 * A real child validation error: the callout block is missing its required `heading`,
 * so the harness's `validateDocument` produces a marker on the child path and the
 * block preview surfaces the error state. Open the callout to see the field-level
 * message.
 */
export const ValidationError: Story = {
  name: 'Validation error on a child block',
  render: () => <PostEditor body={invalidBody} />,
}

/**
 * Schema-level `readOnly: true` on the field: toolbar controls are disabled and the
 * contenteditable rejects input, exactly as the document pane renders a locked field.
 */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => <PostEditor body={populatedBody} documentType="postReadOnly" />,
}

/**
 * **Current (audit finding: `block-editor-authoring`).** The unmodified editor at its
 * weakest discoverability: undo/redo exists but is **keyboard-only** (no toolbar
 * affordance anywhere), block manipulation controls are **hover-revealed** (the object
 * block's menu is invisible until pointed at), and inserting an object mid-paragraph
 * silently **splits the block into fragments** with no warning. Everything shown is
 * the real component; the missing affordances are the finding.
 */
export const CurrentBlockEditorAuthoring: Story = {
  name: 'Current (undo hidden, hover-only structure)',
  tags: ['audit:needs-work'],
  render: () => <PostEditor body={blockObjectBody} />,
}

/**
 * **Recommended (`block-editor-authoring`).** Visible structure and safe manipulation:
 * a persistent undo/redo pair in the toolbar, an always-visible block rail (handle +
 * type label per block, no hover required), and a split warning at the insertion
 * point. Prop-driven illustration in `@sanity/ui` primitives; the real editor already
 * has every underlying operation; this shows the affordances made visible.
 */
export const RecommendedBlockEditorAuthoring: Story = {
  name: 'Recommended (visible structure & undo)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => <VisibleStructureDemo />,
}

/**
 * **Current (audit finding: `governance-deprecation`).** The real insert toolbar with
 * the deprecated **Image** type: it renders as a disabled button visually identical to
 * any contextually-disabled control, its reason ("Use the Callout block instead")
 * surfaced **only** in a hover tooltip, while still holding toolbar space.
 *
 * Honest delta vs the audit note: the audit observed a *live-looking* button that
 * inserted nothing on click; current source (`toolbar/InsertMenu.tsx`) now
 * hard-disables deprecated items: the "hard-disable" half of the audit's own
 * recommendation has landed. The legibility half has not: nothing on the control says
 * *deprecated*, the reason stays hover-only, and it is indistinguishable from a
 * control disabled for any other reason.
 */
export const CurrentGovernanceDeprecation: Story = {
  name: 'Current (deprecated item looks merely disabled)',
  tags: ['audit:needs-work'],
  render: () => (
    <PostEditor
      body={[block([{text: 'With the caret in the text, live inserts enable; Image never does.'}])]}
    />
  ),
  play: async ({canvasElement}) => {
    await placeCaretInEditor(canvasElement)
  },
}

/**
 * **Recommended (`governance-deprecation`).** A clearly-marked deprecated affordance:
 * the retired item is labelled with a **Deprecated** badge, states its reason inline
 * (not hover-only), and points at the replacement with a one-click path, or is
 * removed from prime toolbar space entirely. Prop-driven illustration.
 */
export const RecommendedGovernanceDeprecation: Story = {
  name: 'Recommended (deprecation made legible)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => <LegibleDeprecationDemo />,
}

interface DemoBlock {
  key: string
  label: string
  content: string
  muted?: boolean
}

const demoBlocks: DemoBlock[] = [
  {
    key: 'lead',
    label: 'Paragraph',
    content: 'A block-level object sits in the text flow as a first-class block:',
  },
  {key: 'callout', label: 'Callout', content: 'Ship structured content', muted: true},
  {
    key: 'tail',
    label: 'Paragraph',
    content: 'Text continues after it, select, move or delete it like any block.',
  },
]

/**
 * The `block-editor-authoring` Recommended composition: persistent undo/redo in the
 * toolbar and an always-visible structure rail (drag handle + block-type label on
 * every block), with the mid-block split warning surfaced at the insertion point.
 */
function VisibleStructureDemo() {
  return (
    <Box padding={3} style={{maxWidth: 640}}>
      <Card border radius={2}>
        <Card borderBottom padding={1}>
          <Flex align="center" gap={2}>
            <Flex gap={1}>
              <Button icon={UndoIcon} mode="bleed" text="Undo" fontSize={1} padding={2} />
              <Button icon={RedoIcon} mode="bleed" text="Redo" fontSize={1} padding={2} disabled />
            </Flex>
            <Box flex={1} />
            <Text size={1} muted>
              Style · Marks · Insert
            </Text>
          </Flex>
        </Card>
        <Stack padding={2} gap={1}>
          {demoBlocks.map((demoBlock) => (
            <Card key={demoBlock.key} padding={2} radius={2} tone="transparent">
              <Flex align="flex-start" gap={2}>
                <Text size={1} muted>
                  <DragHandleIcon />
                </Text>
                <Badge fontSize={0}>{demoBlock.label}</Badge>
                <Box flex={1}>
                  {demoBlock.muted ? (
                    <Card border padding={3} radius={2}>
                      <Flex align="center" gap={2}>
                        <Text size={1}>
                          <BulbOutlineIcon />
                        </Text>
                        <Text size={1} weight="medium">
                          {demoBlock.content}
                        </Text>
                      </Flex>
                    </Card>
                  ) : (
                    <Text size={2}>{demoBlock.content}</Text>
                  )}
                </Box>
              </Flex>
            </Card>
          ))}
          <Card padding={2} radius={2} tone="caution">
            <Text size={1}>
              Inserting a block object at the caret will split this paragraph into two blocks.
            </Text>
          </Card>
        </Stack>
      </Card>
    </Box>
  )
}

/**
 * The `governance-deprecation` Recommended composition: the deprecated insert item is
 * badge-labelled, its reason reads inline, and the replacement is one click away.
 */
function LegibleDeprecationDemo() {
  return (
    <Box padding={3} style={{maxWidth: 420}}>
      <Card border radius={2} padding={1}>
        <Stack gap={1}>
          <Card padding={3} radius={2} tone="transparent">
            <Flex align="center" gap={3}>
              <Text size={1}>
                <BulbOutlineIcon />
              </Text>
              <Text size={1} weight="medium">
                Callout
              </Text>
            </Flex>
          </Card>
          <Card padding={3} radius={2} tone="transparent">
            <Flex align="flex-start" gap={3}>
              <Text size={1} muted>
                <ImageIcon />
              </Text>
              <Stack gap={2} flex={1}>
                <Flex align="center" gap={2}>
                  <Text size={1} muted style={{textDecoration: 'line-through'}}>
                    Image
                  </Text>
                  <Badge fontSize={0} tone="caution">
                    Deprecated
                  </Badge>
                </Flex>
                <Text size={1} muted>
                  Use the Callout block instead.
                </Text>
                <Box>
                  <Button text="Insert Callout instead" mode="ghost" fontSize={1} padding={2} />
                </Box>
              </Stack>
            </Flex>
          </Card>
        </Stack>
      </Card>
    </Box>
  )
}

/**
 * A short editorial body: a heading, a decorated paragraph, the novel's opening line as
 * a blockquote, and a callout: real, valid Portable Text for the in-context moment.
 */
const inContextBody: PortableTextBlock[] = [
  block([{text: 'On Tolstoy’s novel'}], {style: 'h2'}),
  block([
    {text: 'Anna Karenina opens on a household in disarray and widens into a study of '},
    {text: 'love, family and consequence', marks: ['em']},
    {text: ', the kind of long-form prose this editor keeps as '},
    {text: 'queryable blocks', marks: ['strong']},
    {text: '.'},
  ]),
  block([{text: 'Happy families are all alike; every unhappy family is unhappy in its own way.'}], {
    style: 'blockquote',
  }),
  {
    _type: 'callout',
    _key: 'inContextCallout',
    heading: 'Editor’s note',
    note: 'Excerpt shown for the sample document, replace with the final introduction.',
  },
]

/**
 * In context: the block editor as the Body of an "Anna Karenina" article being written,
 * sitting beside the document's Title. A live `FormBuilder` over a real document: the
 * heading, the decorated paragraph, the blockquote and the callout are all real editor
 * state. Place the caret anywhere and edit, open the callout, or reach for the toolbar:
 * this is the everyday authoring moment the whole page has been building toward.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType="article"
        initialDocument={{title: 'Anna Karenina', body: inContextBody}}
        height={520}
      />
    </Box>
  ),
}
