import {
  type ObjectSchemaType,
  type PortableTextBlock,
  type PortableTextTextBlock,
  type StringSchemaType,
} from '@sanity/types'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useRef, useState} from 'react'
import {FormBuilderContext} from 'sanity/_singletons'

import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
import {type FormBuilderContextValue} from '../../../../packages/sanity/src/core/form/FormBuilderContext'
// Real components, real paths (org contract §8), reached the same way
// PortableTextEditModals.stories.tsx reaches its four object-modal files: none of these
// are re-exported from the `sanity` package's public entry point. Decorator, ListItem and
// Style are never imported directly below: they are wired into the real editor by
// Editor.tsx (`renderDecorator`) and Compositor.tsx (`renderStyle`/`renderListItem`), so
// this page reaches them the same way PortableTextInput.stories.tsx reaches TextBlock,
// by mounting the real editor and letting Compositor.tsx call them. The two
// `_legacyDefaultParts` components and StringInputPortableText DO need direct imports:
// the former to reach a branch nothing in a real document can produce, the latter because
// FormBuilderHarness's `useFormState` always passes `comparisonValue: null`, so the diff
// machinery it needs never arises through a normal document mount.
import {DefaultCustomMarkers} from '../../../../packages/sanity/src/core/form/inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {DefaultMarkers} from '../../../../packages/sanity/src/core/form/inputs/PortableText/_legacyDefaultParts/Markers'
import {StringInputPortableText} from '../../../../packages/sanity/src/core/form/inputs/StringInput/StringInputPortableText/StringInputPortableText'
import {type ProvenanceDiffAnnotation} from '../../../../packages/sanity/src/core/form/store/types/diff'
import {type PortableTextMarker} from '../../../../packages/sanity/src/core/form/types/_transitional'
import {
  type BlockDecoratorProps,
  type BlockListItemProps,
  type BlockStyleProps,
} from '../../../../packages/sanity/src/core/form/types/blockProps'
import {useWorkspace} from '../../../../packages/sanity/src/core/studio/workspace'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Three small components stand in for a schema author's own custom render components, so
 * a reader can compare CustomComponent against DefaultComponent in the same fixture. Each
 * receives the exact prop shape Decorator.tsx / Style.tsx / ListItem.tsx pass to a schema
 * type's `component` (BlockDecoratorProps / BlockStyleProps / BlockListItemProps).
 */
function FlagDecorator(props: BlockDecoratorProps) {
  return (
    <Box as="span" style={{background: '#fef3c7', borderRadius: 2, padding: '0 2px'}}>
      {props.children}
    </Box>
  )
}

function CalloutStyle(props: BlockStyleProps) {
  return (
    <Card padding={3} radius={2} tone="primary" marginY={2}>
      <Text size={2}>{props.children}</Text>
    </Card>
  )
}

function FlagListItem(props: BlockListItemProps) {
  return (
    <Box style={{outline: '2px dashed #6e56cf', outlineOffset: 2, borderRadius: 2}}>
      {props.children}
    </Box>
  )
}

/**
 * One `post` document type shared by every story on this page. `marks.decorators`,
 * `styles` and `lists` each carry the built-in set (see the JSDoc examples on
 * BlockDecoratorDefinition / BlockStyleDefinition / BlockListDefinition in
 * \@sanity/types) plus one custom-component entry, plus (styles only) one entry with
 * neither: `byline` has no `component` and its `value` is not a key of `text/textStyles.tsx`'s
 * `TEXT_STYLES` map, which is the fixture BuiltInStylesAndSilentFallback needs. The block's
 * own `validation` rule (flagging the literal word URGENT) is what ValidationErrorOnTextBlock
 * needs; no other fixture on this page uses that word.
 */
const schemaTypes = [
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
          {
            type: 'block',
            marks: {
              decorators: [
                {title: 'Strong', value: 'strong'},
                {title: 'Emphasis', value: 'em'},
                {title: 'Underline', value: 'underline'},
                {title: 'Strike', value: 'strike-through'},
                {title: 'Code', value: 'code'},
                {title: 'Flag', value: 'flag', component: FlagDecorator},
              ],
            },
            styles: [
              {title: 'Normal', value: 'normal'},
              {title: 'H1', value: 'h1'},
              {title: 'H2', value: 'h2'},
              {title: 'H3', value: 'h3'},
              {title: 'H4', value: 'h4'},
              {title: 'H5', value: 'h5'},
              {title: 'H6', value: 'h6'},
              {title: 'Quote', value: 'blockquote'},
              {title: 'Callout', value: 'calloutStyle', component: CalloutStyle},
              {title: 'Byline', value: 'byline'},
            ],
            lists: [
              {title: 'Bullet', value: 'bullet'},
              {title: 'Number', value: 'number'},
              {title: 'Flagged', value: 'flag', component: FlagListItem},
            ],
            validation: (rule: {
              custom: (fn: (value: PortableTextTextBlock) => true | string) => unknown
            }) =>
              rule.custom((value) => {
                const text = (value?.children ?? [])
                  .map((child) => ('text' in child ? (child.text as string) : ''))
                  .join('')
                return text.includes('URGENT')
                  ? 'Avoid all-caps urgency signaling in body copy; rephrase.'
                  : true
              }),
          },
        ],
      },
    ],
  },
  // A plain string field, for StringInputPortableText: StringInput.tsx swaps to it only
  // when `displayInlineChanges` is true (the review-changes / compare-versions state),
  // which FormBuilderHarness's fixed `comparisonValue: null` cannot produce, so this
  // page's diff-mode story mounts the component directly and borrows this document
  // type's compiled string schemaType to do it honestly (a real StringSchemaType, not a
  // hand-built object).
  {
    name: 'note',
    title: 'Note',
    type: 'document',
    fields: [{name: 'headline', title: 'Headline', type: 'string'}],
  },
]

interface SpanSpec {
  text: string
  marks?: string[]
}

let keyCounter = 0
function block(
  spans: SpanSpec[],
  options: {
    style?: string
    listItem?: string
    level?: number
    markDefs?: Record<string, unknown>[]
  } = {},
): PortableTextBlock {
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

const decoratorsBody: PortableTextBlock[] = [
  block([
    {text: 'Marks carry their own look: '},
    {text: 'strong', marks: ['strong']},
    {text: ' for emphasis by weight, '},
    {text: 'em', marks: ['em']},
    {text: ' for emphasis by slant, '},
    {text: 'underline', marks: ['underline']},
    {text: ' for a still-used call to action, '},
    {text: 'strike-through', marks: ['strike-through']},
    {text: ' for a retracted claim, and '},
    {text: 'code', marks: ['code']},
    {text: ' for literal text.'},
  ]),
]

const decoratorCustomBody: PortableTextBlock[] = [
  block([
    {text: 'A schema-registered '},
    {text: 'flag', marks: ['flag']},
    {text: ' decorator carries a component override; '},
    {text: 'strong', marks: ['strong']},
    {text: ' beside it has none, so DefaultComponent draws it.'},
  ]),
]

const overlappingMarksBody: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'nestedMarksBlk',
    style: 'normal',
    markDefs: [{_key: 'linkA', _type: 'link', href: 'https://www.sanity.io'}],
    children: [
      {_type: 'span', _key: 's0', text: 'Nesting is stable: ', marks: []},
      {
        _type: 'span',
        _key: 's1',
        text: 'a fully decorated phrase',
        marks: ['flag', 'strong', 'linkA'],
      },
      {
        _type: 'span',
        _key: 's2',
        text: ' reads flag innermost, strong around it, link outermost.',
        marks: [],
      },
    ],
  },
  {
    _type: 'block',
    _key: 'danglingMarkBlk',
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 's3', text: 'A normal span, and ', marks: []},
      {
        _type: 'span',
        _key: 's4',
        text: 'one carrying a mark nobody recognizes',
        marks: ['strong', 'ghost-mark-no-def'],
      },
      {_type: 'span', _key: 's5', text: ', side by side.', marks: []},
    ],
  },
]

const stylesBody: PortableTextBlock[] = [
  block([{text: 'Normal body text.'}], {style: 'normal'}),
  block([{text: 'Heading one'}], {style: 'h1'}),
  block([{text: 'Heading two'}], {style: 'h2'}),
  block([{text: 'Heading three'}], {style: 'h3'}),
  block([{text: 'Heading four'}], {style: 'h4'}),
  block([{text: 'Heading five'}], {style: 'h5'}),
  block([{text: 'Heading six'}], {style: 'h6'}),
  block([{text: 'A block quote, set apart by a rule and indent.'}], {style: 'blockquote'}),
]

const styleCustomAndFallbackBody: PortableTextBlock[] = [
  block([{text: 'Normal, for comparison.'}], {style: 'normal'}),
  block([{text: 'Callout style: a schema component override.'}], {style: 'calloutStyle'}),
  block([{text: 'Byline style: declared in schema, no component, unknown name.'}], {
    style: 'byline',
  }),
]

const listItemsBody: PortableTextBlock[] = [
  block([{text: 'Bullet, level 1'}], {listItem: 'bullet', level: 1}),
  block([{text: 'Bullet, level 2'}], {listItem: 'bullet', level: 2}),
  block([{text: 'Bullet, level 3'}], {listItem: 'bullet', level: 3}),
  block([{text: 'Bullet, level 4 (marker cycle repeats)'}], {listItem: 'bullet', level: 4}),
  block([{text: 'Number, level 1'}], {listItem: 'number', level: 1}),
  block([{text: 'Number, level 2'}], {listItem: 'number', level: 2}),
  block([{text: 'Number, level 3'}], {listItem: 'number', level: 3}),
  block([{text: 'Flagged list item: a schema component override'}], {listItem: 'flag', level: 1}),
]

const validationBody: PortableTextBlock[] = [
  block([{text: 'This paragraph is unremarkable.'}]),
  block([{text: 'This deadline is URGENT and cannot move.'}]),
]

const inContextBody: PortableTextBlock[] = [
  block([{text: 'Shipping notes'}], {style: 'h2'}),
  block([
    {text: 'The release is '},
    {text: 'confirmed', marks: ['strong']},
    {text: ' for Friday; the migration script is '},
    {text: 'still in review', marks: ['em']},
    {text: '.'},
  ]),
  block([{text: 'Freeze the schema before Thursday standup.'}], {listItem: 'bullet', level: 1}),
  block([{text: 'Announce the window in #releases.'}], {listItem: 'bullet', level: 1}),
  block([{text: 'A quiet week is a well-planned week.'}], {style: 'blockquote'}),
]

function PostEditor(props: {body?: PortableTextBlock[]; height?: number}) {
  const {body, height = 360} = props
  return (
    <Box padding={3} style={{maxWidth: 640}}>
      <FormBuilderHarness
        documentType="post"
        initialDocument={body ? {body} : undefined}
        height={height}
      />
    </Box>
  )
}

const meta: Meta = {
  title: 'Forms & Input/Portable Text Renderers',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Three of this subsystem’s failure states never announce themselves, and they fail in ' +
            'three different directions: one drops silently, one falls back silently, and one ' +
            'throws where old content can no longer be trusted to match a live schema.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/PortableText/text/{Decorator,ListItem,Style,TextBlock,textStyles}.tsx`, `.../PortableText/_legacyDefaultParts/{Markers,CustomMarkers}.tsx`, `.../StringInput/StringInputPortableText/StringInputPortableText.tsx` |',
          '| Tier | CORE. The machinery that draws every mark, style and list item the block editor holds; there is no design-system equivalent, same as `Forms & Input/PortableText` itself |',
          '| Findings | 3, one silent drop, one silent fallback, one throw on missing schema |',
          '',
          'The leaf layer under the whole-field page. `PortableTextInput.stories.tsx` shows the ' +
            'editor as a field; this page isolates what actually draws a mark on a span, a ' +
            'heading or blockquote on a block, a bullet or number on a list item, the tooltip ' +
            'content on a validation marker, and the one-line editor a plain string field swaps ' +
            'to when reviewing changes.',
          '',
          'None of the seven components below are re-exported from the `sanity` package. ' +
            '`Decorator` is wired into `renderDecorator` in `Editor.tsx`; `Style` and `ListItem` ' +
            'are wired into `renderStyle`/`renderListItem` alongside `TextBlock` in ' +
            '`Compositor.tsx`. This page reaches all three the same way the whole-field page ' +
            'reaches `TextBlock`: by mounting the real editor (`FormBuilderHarness`) and letting ' +
            '`Compositor.tsx` call them, rather than importing and calling them directly. ' +
            '`DefaultMarkers`/`DefaultCustomMarkers` and `StringInputPortableText` are exercised ' +
            'directly further down, for reasons each of those stories states.',
          '',
          'A schema-declared style with no `component` and a name outside the seven built-ins ' +
            'falls back to `Normal`’s look with no visual trace, distinguishable only via a ' +
            '`data-testid` in the DOM. The opposite failure, a style or list-item value that is ' +
            'not declared in the schema **at all**, does not fall back silently: `Style.tsx` and ' +
            "`ListItem.tsx` both `throw new Error('This should never happen')` on that lookup " +
            'miss, an assumption schema migrations can break for old content, with no story below ' +
            'reproducing it because a thrown render is not one a static build can show.',
          '',
          '> **Why it matters:** a mark on a span that matches neither a registered decorator nor ' +
            'a `markDefs` entry, stale content after a schema author removes a decorator, or a ' +
            'dangling reference to a deleted markDef, is silently dropped by the upstream editor ' +
            'before `Decorator` is ever called, rendering as indistinguishable plain text. Content ' +
            'can lose formatting with nothing in the interface saying so.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: ['autodocs', 'chapter:forms', 'tier:core', 'source:studio-only'],
}

export default meta
type Story = StoryObj

/**
 * The five built-in decorators (`text/constants.ts`'s `TEXT_DECORATOR_TAGS`), none
 * schema-overridden, so every span here renders through `Decorator.tsx`'s
 * `DefaultComponent`: a `<Root as={tag}>` where `tag` is the plain HTML element the mark
 * maps to (`strong`, `em`, `u`, `s`, `code`).
 */
export const BuiltInDecorators: Story = {
  name: 'Decorators, built-in (DefaultComponent)',
  render: () => <PostEditor body={decoratorsBody} />,
}

/**
 * `flag` is declared with `component: FlagDecorator` in this page's schema; `strong`
 * beside it is not. `Decorator.tsx` reads `sanitySchemaType.component` per mark and
 * dispatches to `CustomComponent` or `DefaultComponent` independently for each one, so
 * both renders sit in the same sentence, driven by the same code path.
 */
export const DecoratorCustomComponent: Story = {
  name: 'Decorator, custom component vs default, side by side',
  render: () => <PostEditor body={decoratorCustomBody} />,
}

/**
 * Two findings about marks, from the upstream `@portabletext/editor` leaf renderer
 * (`lib/index.js`, the function building each span's `children`), not from Sanity's own
 * `Decorator.tsx`.
 *
 * First block: a span carries `marks: ['flag', 'strong', 'linkA']`. The editor's decorator
 * loop iterates only the decorator-kind marks, in their array order, wrapping outward each
 * time, so the first decorator processed ends up innermost: `flag` (index 0 among
 * decorators) is innermost, `strong` (index 1) wraps around it. The annotation loop runs
 * strictly afterward and always wraps whatever decorators produced, so the `linkA`
 * annotation is outermost regardless of where its key sits in the `marks` array. Nesting is
 * fully determined by decorator order plus "annotations always outermost", never by
 * annotation position.
 *
 * Second block: a span carries `marks: ['strong', 'ghost-mark-no-def']`, where
 * `ghost-mark-no-def` matches no registered decorator and no entry in this block's
 * (empty) `markDefs`. The editor filters it out of both the decorator list and the
 * annotation list before rendering: it does not draw, does not throw, and leaves no trace
 * in the output. Compare this block's second span against the first block above (a normal
 * span, no annotation): the two are visually identical. This is stale content's most
 * common shape (schema removes a decorator, or a markDef gets deleted while a span still
 * references its key) rendering as if nothing were ever there.
 */
export const OverlappingAndDanglingMarks: Story = {
  name: 'Mark nesting order, and a mark nobody recognizes',
  render: () => <PostEditor body={overlappingMarksBody} />,
}

/**
 * The seven built-in styles from `text/textStyles.tsx`'s `TEXT_STYLES` map, none
 * schema-overridden, each falling through `Style.tsx`'s `DefaultComponentWithFallback` to
 * its matching entry (`Normal`, `Heading1`-`Heading6`, `BlockQuote`).
 */
export const BuiltInStyles: Story = {
  name: 'Styles, built-in (DefaultComponent)',
  render: () => <PostEditor body={stylesBody} height={520} />,
}

/**
 * Three blocks, three different paths through `Style.tsx`. `calloutStyle` carries
 * `component: CalloutStyle`, so `CustomComponent` draws it. `byline` carries no
 * `component`, and `'byline'` is not a key of `TEXT_STYLES`, so
 * `DefaultComponentWithFallback` (`text/Style.tsx:18-23`) takes its fallback branch: it
 * reads `TEXT_STYLES[block.style]` if that key exists, else falls to `TEXT_STYLES[0]`, and
 * takes `FallbackComponent` if that whole expression is falsy. `TEXT_STYLES[0]` is a
 * numeric-index read on a string-keyed object and is always `undefined`, so it is the
 * trailing `FallbackComponent` fallback that actually catches the miss, landing on `Normal`.
 * The visible result: the `byline` block renders pixel-identical to the `normal` block
 * above it. Open the DOM and it does carry `data-testid="text-style--byline"` (set by
 * `TextContainer`'s `data-testid={text-style--${block.style}}`), so the distinction exists,
 * just nowhere a reader can see it.
 */
export const StyleCustomComponentAndSilentFallback: Story = {
  name: 'Style, custom component, and an unknown style rendering as Normal',
  render: () => <PostEditor body={styleCustomAndFallbackBody} />,
}

/**
 * Bullet and number lists across four and three levels: `constants.ts`'s
 * `TEXT_BULLET_MARKERS` (●, ○, ■) and `TEXT_NUMBER_FORMATS` (number, lower-alpha,
 * lower-roman) both cycle every three levels via `TextBlock.styles.ts`'s
 * `textBlockStyle` (`($level - 1) % <array>.length`), which is why the level-4 bullet
 * repeats the level-1 glyph. The final item's `flag` list type carries
 * `component: FlagListItem`: the custom component wraps `ListItem.tsx`'s `children`, which
 * already includes `TextBlock`'s own list-prefix glyph, so a custom list component adds
 * chrome around the built-in marker rather than replacing it, there is no prop for that.
 */
export const ListItemNestingAndCustomComponent: Story = {
  name: 'List items, level cycling, and a custom component',
  render: () => <PostEditor body={listItemsBody} height={420} />,
}

/**
 * A block-level `validation` rule (declared once on this page's `block` schema member)
 * flags any block whose text contains "URGENT". The second block trips it: `TextBlock.tsx`
 * reads its own `useMemberValidation(memberItem?.node)`, sets `data-error` on `TextRoot`
 * (the red inset), and feeds the same `validation` array into `Markers`
 * (`useFormBuilder().__internal.components.Markers`, `DefaultMarkers` unless a plugin
 * overrides it) for the hover tooltip. This is the real, reachable path into
 * `DefaultMarkers`: every other story on this page and on `PortableTextInput.stories.tsx`
 * that never trips validation is, invisibly, `DefaultMarkers` returning `null`.
 */
export const ValidationErrorOnTextBlock: Story = {
  name: 'Validation error on a text block (feeds DefaultMarkers)',
  render: () => <PostEditor body={validationBody} />,
}

/**
 * `DefaultMarkers` and `DefaultCustomMarkers` mounted directly with hand-built props,
 * because `DefaultMarkers` is a RENDERER (its input is whatever `markers`/`validation`
 * arrays it is handed, per `MarkersProps`), so handing it one by hand is supplying input,
 * not answering a question it should be asking itself. This reaches every branch in one
 * frame:
 *
 * - all three validation severities (`getIcon`'s error/warning/info), the same icons and
 *   copy a real invalid block's tooltip would show;
 * - the legacy `markers` fallback: `Markers.tsx`'s
 *   `{!renderCustomMarkers && <CustomMarkers markers={markers} />}` (its sibling line
 *   renders `renderCustomMarkers(markers)` instead when that prop is given), reachable
 *   here because no `renderCustomMarkers` is passed, rendering `DefaultCustomMarkers`'s
 *   placeholder copy.
 *
 * That second branch is real code with no real trigger. `usePortableTextMarkers` reads
 * `PortableTextMarkersContext`, which `PortableTextInput.tsx:413` provides from its own
 * `markers` prop, defaulted to `EMPTY_ARRAY` (`PortableTextInput.tsx:123`); nothing in this
 * codebase ever calls `PortableTextInput` with a non-empty `markers` array, and `Markers`
 * itself only reaches `CustomMarkers` when `markers.length > 0`. `DefaultCustomMarkers`
 * mounts fine, exactly the shape the codex calls out: mounting is not the same claim as
 * being mounted. This frame is the only place in a real studio, or in this catalog, where
 * it is visible at all.
 */
export const MarkersRendererStates: Story = {
  name: 'Markers renderer states (isolated: severities, and a dead branch)',
  render: () => <MarkersRendererStatesDemo />,
}

// DefaultMarkers itself reads `useFormBuilder().__internal.components.CustomMarkers`
// (Markers.tsx:47), so mounting it without a real FormBuilder ancestor throws. Seeding
// the raw context value directly, rather than the FormBuilderProvider that would need
// a whole FormBuilderProps tree to construct one, follows FileUploadChrome.stories.tsx's
// `makeFormBuilderValue` precedent for the same trap.
const formBuilderContextValue = {
  __internal: {
    components: {CustomMarkers: DefaultCustomMarkers},
  },
} as unknown as FormBuilderContextValue

function MarkersRendererStatesDemo() {
  // oxlint-disable-next-line no-deprecated -- deliberately demonstrating the legacy markers renderer path (packages/sanity/src/core/form/inputs/PortableText/_legacyDefaultParts is still shipping)
  const legacyMarkers: PortableTextMarker[] = [{type: 'comment', path: []}]
  return (
    <FormBuilderContext.Provider value={formBuilderContextValue}>
      <Box padding={4} style={{maxWidth: 420}}>
        <Stack gap={4}>
          <Stack gap={2}>
            <Text size={1} weight="medium">
              All three validation severities
            </Text>
            <Card border padding={3} radius={2}>
              <DefaultMarkers
                markers={[]}
                validation={[
                  {level: 'error', message: 'This field is required', path: []},
                  {level: 'warning', message: 'This looks unusually short', path: []},
                  {level: 'info', message: 'Last edited by another contributor', path: []},
                ]}
              />
            </Card>
          </Stack>
          <Stack gap={2}>
            <Text size={1} weight="medium">
              Legacy custom-markers fallback (unreachable via any real document)
            </Text>
            <Card border padding={3} radius={2}>
              <DefaultMarkers markers={legacyMarkers} validation={[]} />
            </Card>
          </Stack>
        </Stack>
      </Box>
    </FormBuilderContext.Provider>
  )
}

/**
 * `StringInput.tsx` renders `StringInputPortableText` only `if (props.displayInlineChanges)`,
 * the review-changes state for a plain string field. `FormBuilderHarness`'s `useFormState`
 * call fixes `comparisonValue: null`, so that state cannot arise by mounting a document
 * through the harness: nothing is ever "different from upstream" there. This story mounts
 * the component directly with hand-built `StringInputProps`, borrowing a real, compiled
 * `StringSchemaType` from this page's `note` document type via `useWorkspace()`, and a
 * real `__unstable_computeDiff` built from `@sanity/diff`'s own `diffInput`/`wrap` (the same
 * two functions `formState.ts:1463-1469` uses to build the real one), rather than a
 * hand-written `Diff` literal. The rendered result is the one-line PTE-backed editable with
 * its diff decorations: unlike `StringInputBasic`, this is the variant built to carry
 * inline change highlighting inside the field itself.
 */
export const StringInputPortableTextDiffMode: Story = {
  name: 'StringInputPortableText (diff mode, isolated mount)',
  render: () => <StringInputPortableTextDiffDemo />,
}

const DIFF_COMPARE_VALUE = 'Ship the release notes on Monday'

function StringInputPortableTextDiffDemo() {
  const workspace = useWorkspace()
  const noteType = workspace.schema.get('note') as ObjectSchemaType | undefined
  const headlineType = noteType?.fields.find((field) => field.name === 'headline')?.type as
    | StringSchemaType
    | undefined
  const focusRef = useRef<{focus: () => void}>(undefined)
  const [value, setValue] = useState<string | undefined>('Ship the release notes on Friday')

  if (!headlineType) {
    throw new Error('StringInputPortableTextDiffDemo: missing "note.headline" schema type')
  }

  // The real function, not a hand-written Diff literal: the same two calls
  // formState.ts:1463-1469 uses to build a live document's `__unstable_computeDiff`.
  const computeDiff = (nextValue: unknown) => {
    const annotation: ProvenanceDiffAnnotation = {provenance: {}}
    return diffInput(wrap(DIFF_COMPARE_VALUE, annotation), wrap(nextValue ?? '', annotation), {})
  }

  return (
    <Box padding={4} style={{maxWidth: 420}}>
      <Text size={1} muted>
        No document field is mounted around this box, only WithStudioProviders. That absence is the
        fixture: it is what makes the diff-mode string input reachable at all.
      </Text>
      <Box marginTop={3}>
        <StringInputPortableText
          onChange={(patch) => {
            const nextPatch = Array.isArray(patch) ? patch[0] : patch
            if (nextPatch && 'value' in nextPatch && typeof nextPatch.value === 'string') {
              setValue(nextPatch.value)
            }
          }}
          readOnly={false}
          displayInlineChanges
          renderDefault={() => <></>}
          id="headline"
          level={0}
          path={['headline']}
          presence={[]}
          validation={[]}
          value={value}
          schemaType={headlineType}
          changed={value !== DIFF_COMPARE_VALUE}
          compareValue={DIFF_COMPARE_VALUE}
          hasUpstreamVersion
          __unstable_computeDiff={computeDiff}
          elementProps={{
            value,
            'id': 'headline',
            'readOnly': false,
            'onChange': () => undefined,
            'onFocus': () => undefined,
            'onBlur': () => undefined,
            'ref': focusRef,
            'aria-describedby': undefined,
            'style': {},
          }}
        />
      </Box>
    </Box>
  )
}

/**
 * In context: a short "Shipping notes" document exercising the ordinary path through every
 * component on this page, decorators, a style, list items, with no schema overrides and no
 * validation error. This is the everyday, unremarkable render that the findings above are
 * the exception to.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => <PostEditor body={inContextBody} height={420} />,
}
