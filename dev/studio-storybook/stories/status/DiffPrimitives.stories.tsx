import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
// Real components from real paths (org contract §8), one file each, as briefed.
import {useAnnotationColor} from '../../../../packages/sanity/src/core/field/diff/annotations/hooks'
import {buildObjectChangeList} from '../../../../packages/sanity/src/core/field/diff/changes/buildChangeList'
import {DiffCard} from '../../../../packages/sanity/src/core/field/diff/components/DiffCard'
import {
  DiffString,
  DiffStringSegment,
} from '../../../../packages/sanity/src/core/field/diff/components/DiffString'
import {DiffTooltip} from '../../../../packages/sanity/src/core/field/diff/components/DiffTooltip'
import {FieldChange} from '../../../../packages/sanity/src/core/field/diff/components/FieldChange'
import {FromToArrow} from '../../../../packages/sanity/src/core/field/diff/components/FromToArrow'
import {GroupChange} from '../../../../packages/sanity/src/core/field/diff/components/GroupChange'
import {
  type AnnotationDetails,
  type ChangeNode,
  type FieldChangeNode,
  type GroupChangeNode,
  type ObjectDiff,
  type StringDiff,
} from '../../../../packages/sanity/src/core/field/types'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {DiffStage, diffSchemaTypes, diffStudioConfig} from '../../lib/diffHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── The schema ───────────────────────────────────────────────────────────
   `diffSchemaTypes`'s `seo` object has two fields, `metaTitle` and `noIndex`, neither configured
   `hidden`. `seoHiddenType` is a second copy with both individually hidden - the only way to get a
   `GroupChangeNode` whose `changes` array is real and non-empty (the builder never emits an empty
   group; see the ZeroVisibleChildren story below) but whose visible output is nothing, because each
   child's OWN conditional-hidden check drops it independently inside a nested `ChangeResolver`
   call. `articleHiddenSeo` points its `seo` field at that type instead of the shared one. */

const seoType = diffSchemaTypes.find((t) => t.name === 'seo')!
const articleType = diffSchemaTypes.find((t) => t.name === 'article')!

const seoHiddenType = {
  ...seoType,
  name: 'seoHidden',
  fields: seoType.fields.map((f) =>
    f.name === 'metaTitle' || f.name === 'noIndex' ? {...f, hidden: true} : f,
  ),
}

const articleHiddenSeo = {
  ...articleType,
  name: 'articleHiddenSeo',
  fields: articleType.fields.map((f) => (f.name === 'seo' ? {...f, type: 'seoHidden'} : f)),
}

const schemaTypes = [...diffSchemaTypes, seoHiddenType, articleHiddenSeo]

const AUTHOR = 'ada'
const now = () => new Date().toISOString()

/** A plain `article` diff. No `useSchema()` needed - `DiffCard`/`DiffString` read a computed
 * `Diff`, not a schema type, so this can run outside a component, same as `DiffFromTo`'s
 * `fieldDiff` helper. */
function articleDiff(from: Record<string, unknown>, to: Record<string, unknown>): ObjectDiff {
  return diffInput(
    wrap({_type: 'article', ...from}, {author: AUTHOR}),
    wrap({_type: 'article', ...to}, {author: AUTHOR}),
  ) as ObjectDiff
}

function titleDiff(from: Record<string, unknown>, to: Record<string, unknown>): StringDiff {
  return articleDiff(from, to).fields.title as StringDiff
}

const TITLE_CASES = {
  unchanged: {
    from: {title: 'The Garden of Forking Paths'},
    to: {title: 'The Garden of Forking Paths'},
  },
  changed: {from: {title: 'The Waves - a reading guide'}, to: {title: 'The Waves - a viewing log'}},
  added: {from: {}, to: {title: 'The Garden of Forking Paths'}},
  removed: {from: {title: 'The Garden of Forking Paths'}, to: {}},
} as const

function Frame({children, maxWidth = 480}: {children: ReactNode; maxWidth?: number}) {
  return (
    <Card border padding={3} radius={0} style={{maxWidth}}>
      {children}
    </Card>
  )
}

function Row({label, note, children}: {label: string; note: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text muted size={1}>
        {note}
      </Text>
      {children}
    </Stack>
  )
}

/**
 * Builds a real `ChangeNode[]` from two documents via `buildObjectChangeList` (the same function
 * `ChangeList` calls) and provides the `DocumentChangeContext` every downstream diff component
 * reads. Same shape as `ChangeResolver.stories.tsx`'s `ChangeNodeStage`, generalised over
 * `typeName` so it can also build the `articleHiddenSeo` variant.
 */
const noopWrapper = (props: {children: ReactNode}) => props.children

function Staged({
  typeName,
  from,
  to,
  render,
}: {
  typeName: string
  from: Record<string, unknown>
  to: Record<string, unknown>
  render: (changes: ChangeNode[]) => ReactNode
}) {
  const schema = useSchema()
  const schemaType = schema.get(typeName) as ObjectSchemaType
  const diff = useMemo(
    () =>
      diffInput(
        wrap({_type: typeName, ...from}, {author: AUTHOR}),
        wrap({_type: typeName, ...to}, {author: AUTHOR}),
      ) as ObjectDiff,
    [typeName, from, to],
  )
  const changes = useMemo(
    () => buildObjectChangeList(schemaType, diff, [], [], {}),
    [schemaType, diff],
  )

  return (
    <DocumentChangeContext.Provider
      value={{
        documentId: 'doc-1',
        schemaType,
        rootDiff: diff,
        isComparingCurrent: false,
        FieldWrapper: noopWrapper as never,
        value: {_type: typeName, ...to} as Partial<SanityDocument>,
        showFromValue: true,
      }}
    >
      {render(changes)}
    </DocumentChangeContext.Provider>
  )
}

const meta: Meta = {
  title: 'Lists & Data/Diff Primitives',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'These are the six pieces every reviewer reads a change through. A dead prop that no ' +
            'caller wires up is inert risk on its own, but a group that can look empty while ' +
            'still offering to revert changes nobody can see, and a tooltip that says a user is ' +
            'loading when no such user exists, are both things a person acts on mid-review.',
          '',
          '|          |                                                                                                                                                                                                                     |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/field/diff/components/{DiffString,DiffCard,DiffTooltip,FromToArrow,FieldChange,GroupChange}.tsx`                                                                                          |',
          '| Tier     | CORE. `ChangeResolver` (its own page) dispatches to `FieldChange`/`GroupChange`; everything below those two is drawn with `DiffCard`, `DiffTooltip`, `DiffString`/`DiffStringSegment`, and `FromToArrow`            |',
          '| Audit    | 🟡 needs-work (`change-visibility`, `attribution`). A dead prop shared by two components, a group that can render its shell over zero content, and a tooltip that cannot tell "still loading" from "failed to load" |',
          '| Patterns | `change-visibility` · `attribution`                                                                                                                                                                                 |',
          '',
          'Companion to `ChangeResolver` (dispatch) and `DiffFromTo` (the from/to atom): this ' +
            'page is the parts list underneath both. Every story below is built from real ' +
            'documents through `diffInput(wrap(from), wrap(to))` and, for ' +
            '`FieldChange`/`GroupChange`, the real `buildObjectChangeList`, the same functions ' +
            '`ChangeList` and `ChangeResolver` call. Nothing here is a hand-built `Diff` or ' +
            '`ChangeNode` literal.',
          '',
          '**The returns, quoted.**',
          '',
          '`DiffStringSegment` (three states, `DiffString.tsx:37-75`):',
          '',
          '```tsx',
          "if (segment.action === 'added') return <DiffCard as={RoundedCard} disableHoverEffect " +
            'tooltip={...}><ChangeSegment as="ins" style={{textDecoration: ' +
            "'none'}}>{text}</ChangeSegment></DiffCard>",
          "if (segment.action === 'removed') return <DiffCard as={RoundedCard} " +
            'disableHoverEffect tooltip={...}><ChangeSegment ' +
            'as="del">{text}</ChangeSegment></DiffCard>',
          '// unchanged:',
          'return <Card as="span" radius={2} style={{display: \'inline\'}}>{text}</Card>',
          '```',
          '',
          '`DiffCard` (two states, `DiffCard.tsx:121-132`): `if (tooltip && annotation) return ' +
            '<DiffTooltip ...>{element}</DiffTooltip>`, else the bare `element`.',
          '',
          '`DiffTooltip` (`DiffTooltip.tsx:30-38`): re-dispatches on which prop shape it was ' +
            'given (`diff`+`path` vs a pre-resolved `annotations` array) to the same inner ' +
            'renderer. `AnnotationItem` (`:72-115`) is the part that draws one row: `{author && ' +
            '(<UserAvatar .../><Text>{user ? user.displayName : ' +
            "t('changes.loading-author')}</Text>)}`.",
          '',
          '`FromToArrow` (`FromToArrow.tsx:15-27`): one return, a `Text` wrapping whichever of ' +
            'two icons `direction` selects.',
          '',
          '`FieldChange`/`GroupChange`: each opens with `if (hidden) return null` ' +
            '(`FieldChange.tsx:136`, `GroupChange.tsx:103` inside the memo and again at `:173`), ' +
            'then renders the row (breadcrumb, the resolved diff component, an optional revert ' +
            'button).',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>`FieldChange.hidden` and `GroupChange.hidden` are dead props: no caller ' +
            'in the codebase ever supplies them.</b></summary>',
          '',
          '`ChangeResolver` is the only place either component is constructed (`grep -rn ' +
            '"<FieldChange\\|<GroupChange" packages/sanity/src` returns exactly those two call ' +
            'sites), and its own source passes `readOnly` and (for groups) a `data-testid`, never ' +
            '`hidden`:',
          '',
          '```tsx',
          '<FieldChange change={change} readOnly={isReadOnly} ' +
            'addParentWrapper={props.addParentWrapper} />',
          '<GroupChange change={change} data-testid={`group-change-${change.fieldsetName}`} ' +
            'readOnly={isReadOnly} />',
          '```',
          '',
          '`ChangeResolver` handles hiding itself, one level up, with its own `isHidden` check ' +
            '(`if (isHidden) return null`) before either component is ever called, so the ' +
            '`hidden` branch each one carries is reachable only by a story handing it the prop ' +
            'directly, which is exactly what `HiddenPropUnreachable` below does, labelled as ' +
            "evidence about the code rather than the product. Same shape as `ChangeResolver`'s " +
            'own unreachable "unknown change type" branch documented on that component\'s page, a ' +
            'third instance of the same pattern in one small subsystem.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>A `GroupChangeNode` can carry real, non-empty `changes` and still render ' +
            'nothing visible.</b></summary>',
          '',
          'The builder (`buildChangeList.ts:120-133`) never emits an empty group, `if ' +
            '(changes.length < 2) return changes` runs first, so a `GroupChangeNode` always has ' +
            'at least two children by construction. But each child is re-entered through its own ' +
            '`ChangeResolver`, which re-checks `isHidden` independently per child. Mark both ' +
            'fields of a nested object `hidden: true` in the schema (not the group itself) and ' +
            'the group shell, breadcrumb, revert affordance, renders exactly as it does for two ' +
            'visible changes, with nothing inside the list it wraps. `ZeroVisibleChildren` below ' +
            'reaches this with the real builder, no fabricated node.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Adding is not distinguished from unchanged by anything except ' +
            'colour.</b></summary>',
          '',
          '`DiffStringSegment`\'s removed branch renders `as="del"`, which keeps its element\'s ' +
            'inherited strikethrough; the added branch renders `as="ins"` with ' +
            "`style={{textDecoration: 'none'}}`, the underline `<ins>` would otherwise get is " +
            'explicitly switched off. So removed carries a real non-colour signal and added does ' +
            'not: an added span differs from a plain unchanged span by background colour alone ' +
            '(plus a hover tooltip, which is not a persistent signal). And that background colour ' +
            "is not even semantic: `DiffCard`'s tone comes from `useAnnotationColor`, which is " +
            'keyed by author, not by action (`user-color/manager.ts:107-113`, ' +
            '`getAnnotationColor` at `annotations/helpers.ts:22-27`). Two segments by the same ' +
            'author, one added, one removed, render in the identical background and text colour. ' +
            '`ToneIsAuthorNotAction` shows this directly, with the resolved hex values printed as ' +
            "text so the claim does not depend on anyone's colour vision.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>`DiffTooltip` cannot tell "still loading" from "failed to load" from "no ' +
            'such user".</b></summary>',
          '',
          '`AnnotationItem` reads `const [user] = useUser(author)`, discarding the loading flag ' +
            '`useUser` returns alongside the value, so every one of those three states falls ' +
            "through to the identical `t('changes.loading-author')` string forever. `getUser` " +
            '(`user/userStore.ts:83-99`) itself resolves `null`, not a rejected promise, for both ' +
            'an unknown id and a 403; there is no error path for `AnnotationItem` to have ' +
            'discarded even if it read the second tuple element. `AuthorRecordNeverResolves` ' +
            "below reaches this with a real, unseeded author id against this storybook's own mock " +
            "client, no custom fetch stub required, because the real store's own `null`-on-miss " +
            'behaviour is what produces it.',
          '',
          '</details>',
          '',
          '> **Why it matters:** an added change and a removed change by the same author render ' +
            'in identical colour, distinguished only by underline-off versus strikethrough. The ' +
            'one signal telling a reviewer "this appeared" from "this vanished" is easy to miss.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {...diffStudioConfig, schema: {name: 'storybook', types: schemaTypes}},
    }),
  ],
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:change-visibility',
    'pattern:attribution',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/* ── DiffString / DiffStringSegment ─────────────────────────────────────── */

/** The three states `DiffStringSegment` can return, each pulled from a real string diff rather
 * than a hand-built segment. */
export const SegmentStates: Story = {
  name: 'DiffStringSegment: three states',
  render: () => {
    const added = titleDiff(TITLE_CASES.added.from, TITLE_CASES.added.to)
    const removed = titleDiff(TITLE_CASES.removed.from, TITLE_CASES.removed.to)
    const unchanged = titleDiff(TITLE_CASES.unchanged.from, TITLE_CASES.unchanged.to)
    return (
      <Stack gap={5} style={{maxWidth: 560}}>
        <Row label="action === 'added'" note="No fromValue: the whole string is one added segment.">
          <Frame>
            <Text size={2}>
              <DiffStringSegment segment={added.segments[0]} />
            </Text>
          </Frame>
        </Row>
        <Row
          label="action === 'removed'"
          note="No toValue: the whole string is one removed segment."
        >
          <Frame>
            <Text size={2}>
              <DiffStringSegment segment={removed.segments[0]} />
            </Text>
          </Frame>
        </Row>
        <Row
          label="action === 'unchanged'"
          note="A bare Card, no annotation, no tooltip - this is the fallback branch, not a DiffCard at all."
        >
          <Frame>
            <Text size={2}>
              <DiffStringSegment segment={unchanged.segments[0]} />
            </Text>
          </Frame>
        </Row>
      </Stack>
    )
  },
}

/**
 * `DiffString` itself: the wrapper that maps `diff.segments` to `DiffStringSegment`. The two
 * titles below share a prefix on purpose, so `diff-match-patch`'s semantic cleanup produces a mix
 * of unchanged, removed and added segments in one pass rather than one segment covering the whole
 * string - the everyday shape of an edited sentence, not a full replacement.
 */
export const InlineChangedString: Story = {
  name: 'DiffString: a multi-segment changed value',
  render: () => {
    const diff = titleDiff(TITLE_CASES.changed.from, TITLE_CASES.changed.to)
    return (
      <Frame maxWidth={560}>
        <Text size={2} style={{whiteSpace: 'pre-wrap'}}>
          <DiffString diff={diff} />
        </Text>
      </Frame>
    )
  },
}

/* ── DiffCard ──────────────────────────────────────────────────────────── */

/** `tooltip && annotation` both true: a changed field has an annotation, so the card is wrapped
 * in `DiffTooltip`. The tooltip content itself only appears on hover (see the DiffTooltip section
 * below for what it contains) - this story shows the wrapping is real, not what a screenshot of a
 * hover state would show. */
export const AnnotatedAndTooltipped: Story = {
  name: 'DiffCard: annotation + tooltip requested',
  render: () => {
    const diff = titleDiff(TITLE_CASES.changed.from, TITLE_CASES.changed.to)
    return (
      <Frame>
        <DiffCard diff={diff} tooltip>
          <Text size={2}>{diff.toValue}</Text>
        </DiffCard>
      </Frame>
    )
  },
}

/**
 * Tooltip requested, but `getAnnotationAtPath` returns `undefined` for an `unchanged` diff
 * (`annotations/helpers.ts:48-50` checks `action === 'unchanged'` explicitly and bails). So
 * `tooltip && annotation` is false even though `tooltip` was passed, and `DiffCard` falls through
 * to the bare element - no tooltip wrapper, no hover affordance at all.
 */
export const NoAnnotationTooltipRequested: Story = {
  name: 'DiffCard: tooltip requested, no annotation to show',
  render: () => {
    const diff = titleDiff(TITLE_CASES.unchanged.from, TITLE_CASES.unchanged.to)
    return (
      <Frame>
        <DiffCard diff={diff} tooltip>
          <Text size={2}>{diff.toValue}</Text>
        </DiffCard>
      </Frame>
    )
  },
}

function ColourReadout({author}: {author: string}) {
  const color = useAnnotationColor({author, timestamp: now()} as AnnotationDetails)
  return (
    <Text size={0} muted style={{fontFamily: 'monospace'}}>
      background {color.background} / text {color.text}
    </Text>
  )
}

/**
 * `DiffCard`'s tone is not "added is green, removed is red" - it is `useAnnotationColor`, keyed
 * purely by `annotation.author` (`user-color/manager.ts:107-113`). Both cards below carry the
 * *same* author, one standing in for an added segment and one for a removed segment, and the
 * resolved hex values are printed underneath rather than left for the eye to judge. If the tone
 * carried the add/remove meaning, these two swatches would differ; they do not.
 */
export const ToneIsAuthorNotAction: Story = {
  name: 'DiffCard: tone is per-author, not per-action',
  render: () => {
    const sameAuthorAdded: AnnotationDetails = {author: AUTHOR, timestamp: now()}
    const sameAuthorRemoved: AnnotationDetails = {author: AUTHOR, timestamp: now()}
    return (
      <Stack gap={3} style={{maxWidth: 480}}>
        <Text muted size={1}>
          Both annotated by the same author ({AUTHOR}). Only the semantic markup (ins vs del)
          differs.
        </Text>
        <Flex gap={3}>
          <Stack gap={2}>
            <DiffCard annotation={sameAuthorAdded}>
              <Text as="ins" size={2} style={{textDecoration: 'none'}}>
                added text
              </Text>
            </DiffCard>
            <ColourReadout author={AUTHOR} />
          </Stack>
          <Stack gap={2}>
            <DiffCard annotation={sameAuthorRemoved}>
              <Text as="del" size={2}>
                removed text
              </Text>
            </DiffCard>
            <ColourReadout author={AUTHOR} />
          </Stack>
        </Flex>
      </Stack>
    )
  },
}

/* ── DiffTooltip ───────────────────────────────────────────────────────── */

/**
 * The three author states `AnnotationItem` (inside `DiffTooltip`) can be handed, and what each
 * produces on hover, quoted from source rather than screenshotted - `@sanity/ui`'s `Tooltip` has
 * no controlled `open` prop, so a static build cannot capture the popover content directly (the
 * same limitation `DiffFromTo`'s page notes for its own hover-only verb). What's shown below is
 * the real, closed wrapping; the caption states exactly what hovering each one reveals.
 */
export const KnownAuthor: Story = {
  name: 'DiffTooltip: author resolves',
  render: () => {
    const annotation: AnnotationDetails = {author: 'doug', timestamp: now()}
    return (
      <Stack gap={2} style={{maxWidth: 480}}>
        <Frame>
          <DiffTooltip annotations={[annotation]} description="Changed">
            <DiffCard annotation={annotation}>
              <Text size={2}>Studio</Text>
            </DiffCard>
          </DiffTooltip>
        </Frame>
        <Text size={0} muted>
          {`'doug' is this harness's seeded current user, so useUser resolves a real record: on hover, an avatar and the display name "Doug".`}
        </Text>
      </Stack>
    )
  },
}

/**
 * `author` is typed as a required `string` on `AnnotationDetails`, but nothing stops it from being
 * the empty string at runtime - `wrap()` takes whatever annotation value it is given. The
 * `author && ...` guard on `DiffTooltip.tsx:97` skips the whole avatar-and-name block for a falsy
 * author, so this is not "loading", it is a pill with nothing in it next to the relative time.
 */
export const UnknownAuthor: Story = {
  name: 'DiffTooltip: no author on the annotation',
  render: () => {
    const annotation: AnnotationDetails = {author: '', timestamp: now()}
    return (
      <Stack gap={2} style={{maxWidth: 480}}>
        <Frame>
          <DiffTooltip annotations={[annotation]} description="Changed">
            <DiffCard annotation={annotation}>
              <Text size={2}>Studio</Text>
            </DiffCard>
          </DiffTooltip>
        </Frame>
        <Text size={0} muted>
          On hover: no avatar, no name - the author block does not render at all, only the relative
          time sits in the tooltip.
        </Text>
      </Stack>
    )
  },
}

/**
 * `author` is a real, non-empty id that nothing in this harness (or, per `userStore.ts`'s own
 * `null`-on-miss reduce, a real Studio either) has a record for. `getUser` resolves `null` rather
 * than rejecting - by design, the same branch that handles a 403 - so `useUser` settles with
 * `user: null`. `AnnotationItem` reads only `const [user] = useUser(author)`, discarding the
 * loading flag entirely, so `user ? user.displayName : t('changes.loading-author')` shows
 * "Loading author..." and never stops, indistinguishable from a request still in flight.
 */
export const AuthorRecordNeverResolves: Story = {
  name: 'DiffTooltip: author id with no user record (finding)',
  render: () => {
    const annotation: AnnotationDetails = {author: 'ghost-writer', timestamp: now()}
    return (
      <Stack gap={2} style={{maxWidth: 480}}>
        <Frame>
          <DiffTooltip annotations={[annotation]} description="Changed">
            <DiffCard annotation={annotation}>
              <Text size={2}>Studio</Text>
            </DiffCard>
          </DiffTooltip>
        </Frame>
        <Text size={0} muted>
          On hover: "Loading author..." forever. A deleted or inaccessible user and a request that
          has not returned yet render identically, because the component never looks at the loading
          flag `useUser` gives it.
        </Text>
      </Stack>
    )
  },
}

/* ── FromToArrow ───────────────────────────────────────────────────────── */

/** One return, a lookup of two icons. `right` is the default the from/to layout uses inline;
 * `down` is what a stacked/grid layout passes explicitly. */
export const Directions: Story = {
  name: 'FromToArrow: both directions',
  render: () => (
    <Flex gap={4} align="center">
      <Stack gap={2}>
        <Text size={1} muted>
          right (default)
        </Text>
        <Frame maxWidth={80}>
          <FromToArrow />
        </Frame>
      </Stack>
      <Stack gap={2}>
        <Text size={1} muted>
          down
        </Text>
        <Frame maxWidth={80}>
          <FromToArrow direction="down" />
        </Frame>
      </Stack>
    </Flex>
  ),
}

/* ── FieldChange ───────────────────────────────────────────────────────── */

const LEAF_CHANGE = {
  from: {title: 'The Golden Notebook'},
  to: {title: 'The Waves'},
}

/** A single changed leaf field, built by the real `buildObjectChangeList` and mounted directly -
 * `FieldChange` is a renderer whose input is the `FieldChangeNode`, same standing as
 * `DiffFromTo`/`JsonFieldDiff` being handed a computed `Diff`. */
export const LeafChange: Story = {
  name: 'FieldChange: a leaf change',
  render: () => (
    <Staged
      typeName="article"
      {...LEAF_CHANGE}
      render={(changes) => (
        <Frame>
          <FieldChange change={changes[0] as FieldChangeNode} />
        </Frame>
      )}
    />
  ),
}

/**
 * `hidden` reached directly, not through `ChangeResolver`. No caller in the codebase ever supplies
 * this prop (finding 1 in the docblock above) - `ChangeResolver` hides changes with its own
 * `isHidden` check one level up and never passes `hidden` down. This story exists to show the
 * branch is real and correctly wired, not to claim it is reachable in a real Studio.
 */
export const HiddenPropUnreachable: Story = {
  name: 'FieldChange: hidden prop (unreachable in practice)',
  render: () => (
    <Staged
      typeName="article"
      {...LEAF_CHANGE}
      render={(changes) => (
        <Stack gap={3} style={{maxWidth: 480}}>
          <Card border style={{borderStyle: 'dashed'}} radius={0} padding={4}>
            <FieldChange change={changes[0] as FieldChangeNode} hidden />
          </Card>
          <Text size={0} muted>
            the dashed box is the story frame; FieldChange itself rendered nothing
          </Text>
        </Stack>
      )}
    />
  ),
}

/* ── GroupChange ───────────────────────────────────────────────────────── */

const SEO_CHANGE = {
  from: {seo: {_type: 'seo', metaTitle: 'The Golden Notebook - overview', noIndex: false}},
  to: {seo: {_type: 'seo', metaTitle: 'The Waves - a reading guide', noIndex: true}},
}

/** A change is a group when two or more sibling changes collapse into one node -
 * `buildChangeList.ts:120-133`: `if (changes.length < 2) return changes`, else wrap the whole set
 * as one `GroupChangeNode`. `metaTitle` and `noIndex` both changing inside `seo` is exactly that:
 * one group, two visible children, mounted directly (not through `ChangeResolver`). */
export const VisibleChildren: Story = {
  name: 'GroupChange: two visible children',
  render: () => (
    <Staged
      typeName="article"
      {...SEO_CHANGE}
      render={(changes) => (
        <Frame maxWidth={560}>
          <GroupChange change={changes[0] as GroupChangeNode} />
        </Frame>
      )}
    />
  ),
}

/**
 * Same two-field change, but both `metaTitle` and `noIndex` are individually `hidden: true` on
 * `articleHiddenSeo`'s schema (not on the group). The builder still wraps them as one
 * `GroupChangeNode` with `changes.length === 2` - it never produces an empty group - but
 * `GroupChange` renders each child through its own nested `ChangeResolver`, which drops both
 * independently. The breadcrumb and shell render exactly as they do for `VisibleChildren`; the
 * list inside is empty. Nothing here is fabricated: this is the real builder plus a real schema
 * condition, just one most reviewers never construct on purpose.
 */
export const ZeroVisibleChildren: Story = {
  name: 'GroupChange: real children, nothing visible (finding)',
  render: () => (
    <Staged
      typeName="articleHiddenSeo"
      {...SEO_CHANGE}
      render={(changes) => (
        <Stack gap={3} style={{maxWidth: 560}}>
          <Card border style={{borderStyle: 'dashed'}} radius={0} padding={4}>
            <GroupChange change={changes[0] as GroupChangeNode} />
          </Card>
          <Text size={0} muted>
            {`the group's own changes.length is 2 - both children resolved hidden inside their own ChangeResolver call, so the list they'd sit in is empty`}
          </Text>
        </Stack>
      )}
    />
  ),
}

/* ── In context ────────────────────────────────────────────────────────── */

/**
 * All six primitives at once, through the real pipeline: `title` (string, exercises
 * `DiffString`/`DiffStringSegment`/`DiffCard`/`DiffTooltip`), `featured` (boolean, its diff
 * component imports `FromToArrow` directly) and two changed `seo` fields (a nested `GroupChange`
 * inside the root `GroupChange`, each leaf a `FieldChange`). This is the shape a reviewer actually
 * sees; the stories above are its parts taken apart.
 */
export const InContext: Story = {
  render: () => (
    <Card border radius={0} padding={4} style={{maxWidth: 620}}>
      <DiffStage
        from={{
          title: 'The Golden Notebook',
          featured: false,
          seo: {_type: 'seo', metaTitle: 'The Golden Notebook - overview', noIndex: false},
        }}
        to={{
          title: 'The Waves',
          featured: true,
          seo: {_type: 'seo', metaTitle: 'The Waves - a reading guide', noIndex: true},
        }}
      />
    </Card>
  ),
}
