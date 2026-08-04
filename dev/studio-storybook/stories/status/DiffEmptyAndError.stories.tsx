import {type ReleaseDocument} from '@sanity/client'
import {DocumentIcon} from '@sanity/icons/Document'
import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo} from 'react'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
// Real components from real paths (org contract §8).
import {ChangeBreadcrumb} from '../../../../packages/sanity/src/core/field/diff/components/ChangeBreadcrumb'
import {ChangesError} from '../../../../packages/sanity/src/core/field/diff/components/ChangesError'
import {Event} from '../../../../packages/sanity/src/core/field/diff/components/Event'
import {FallbackDiff} from '../../../../packages/sanity/src/core/field/diff/components/FallbackDiff'
import {MetaInfo} from '../../../../packages/sanity/src/core/field/diff/components/MetaInfo'
import {NoChanges} from '../../../../packages/sanity/src/core/field/diff/components/NoChanges'
import {ValueError} from '../../../../packages/sanity/src/core/field/diff/components/ValueError'
import {
  type Annotation,
  type ChangeTitlePath,
  type FieldChangeNode,
  type FromToIndex,
  type ObjectDiff,
} from '../../../../packages/sanity/src/core/field/types'
import {type FieldValueError} from '../../../../packages/sanity/src/core/field/validation'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {MissingSinceDocumentError} from '../../../../packages/sanity/src/core/store/events/getDocumentChanges'
import {
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from '../../../../packages/sanity/src/core/store/events/types'
import {diffSchemaTypes, diffStudioConfig} from '../../lib/diffHarness'
import {createUserServingClient, fixtureUsers} from '../../lib/mockCollabFixtures'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'

/* ── What this page is ───────────────────────────────────────────────────────
   Seven components, none of which are "a diff" - they are what Review Changes shows INSTEAD
   of a diff, or draws AROUND one, when something other than "here is what changed" is true:
   nothing changed, the changes failed to load, a single field's value does not match its
   schema, a field's type has no diff renderer, or the page needs to say who and when. None of
   these were the subject of the sibling pages (ChangeResolver, DiffFromTo, ImageFieldDiff,
   ChangeTitleSegment) - they are its scaffolding. */

const AUTHOR = fixtureUsers[0].id // 'doug', resolvable through createUserServingClient()

function fieldArticleDiff(from: Record<string, unknown>, to: Record<string, unknown>): ObjectDiff {
  return diffInput(
    wrap({_type: 'article', ...from}, {author: AUTHOR}),
    wrap({_type: 'article', ...to}, {author: AUTHOR}),
  ) as ObjectDiff
}

const meta: Meta = {
  title: 'Lists & Data/Diff Empty and Error States',
  decorators: [
    WithStudioProviders({
      config: {...diffStudioConfig, schema: {name: 'storybook', types: diffSchemaTypes}},
      client: createUserServingClient(),
      previewStore: createMockDocumentPreviewStore({documents: []}),
    }),
  ],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The two states meaning there is nothing to show are distinguished by a card tone ' +
            'alone, the same colour-only pattern this program keeps finding elsewhere. And the ' +
            'renderer meant to catch a field type with no diff renderer appears to be defensive ' +
            'code with no live caller.',
          '',
          '|          |                                                                                                                                                                                                                        |',
          '| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/field/diff/components/{NoChanges,ChangesError,ValueError,FallbackDiff,MetaInfo,ChangeBreadcrumb,Event}.tsx`                                                                                  |',
          '| Tier     | SERVICE for the four empty/error states (each is the whole content of the Review Changes panel when it applies); CHROME for `MetaInfo`, `ChangeBreadcrumb`, and `Event` (framing around a diff, never the diff itself) |',
          '| Audit    | 🟡 needs-work (`change-visibility`, `error-recovery`). See the findings below                                                                                                                                          |',
          '| Patterns | `change-visibility` · `error-recovery`                                                                                                                                                                                 |',
          '',
          'The pieces Review Changes reaches for when there is no ordinary diff to draw: the ' +
            'empty panel, the load-failure card, a single field whose stored value does not match ' +
            'its schema, the renderer a field type falls back to when none is registered for it, ' +
            'plus three small chrome pieces (a caption row, a breadcrumb, a timeline entry) that ' +
            'frame diffs elsewhere on this page and on the sibling pages.',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>Put the four "not a normal diff" states side by side and judge honestly ' +
            'whether a person could tell which one they are looking at.</b></summary>',
          '',
          '`NoChanges` and `ChangesError` (its default, non-revision branch) share the ' +
            'identical visual grammar: an `<h3>` title in `<Text size={1} weight="medium">`, then ' +
            'a muted paragraph underneath, nothing else. `NoChanges` sits on the bare pane ' +
            'background; `ChangesError` wraps the same shape in `Card tone="caution"`, a pale ' +
            'amber card with a matching border. That card is a real, legible differentiator in ' +
            'the canvas view below, but it is the only one: strip colour (screenshot in ' +
            'grayscale, print it, view it with a colour-vision deficiency) and the caution tone ' +
            'desaturates toward the same neutral the "no changes" card never had a colour to lose ' +
            'in the first place, two structurally identical text blocks, one now framed in a ' +
            'slightly darker rectangle. `ValueError` is not close to either: `Card ' +
            'tone="critical"` (red, not amber), a `Flex` with an `ErrorOutlineIcon`, and no ' +
            '`<h3>` title at all, just one paragraph beside the icon. It also appears in a ' +
            'completely different slot: `NoChanges`/`ChangesError` replace the whole Review ' +
            'Changes panel; `ValueError` replaces one field inside an otherwise-normal change ' +
            'list (see `FieldChange.tsx`: `{change.error ? <ValueError .../> : <DiffComponent ' +
            '.../>}`). `FallbackDiff` is not a message at all: it renders a real before/after ' +
            'value pair through `DiffFromTo`, so a person seeing it would not read it as a state, ' +
            'they would read it as an ordinary diff. The honest verdict: `ValueError` and ' +
            '`FallbackDiff` are unmistakable from the other three and from each other; ' +
            '`NoChanges` and `ChangesError` are the pair that could be confused at a glance, and ' +
            'the only thing standing between them is a card tone.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>`FallbackDiff` does not say "no diff renderer is registered for this ' +
            'field type."</b></summary>',
          '',
          'Read `FallbackDiff.tsx`: it wraps `DiffFromTo` with a `FallbackPreview` that calls ' +
            'the generic `<Preview schemaType value layout="default"/>`, the same component a ' +
            'reference or document preview uses. Nothing in its output names itself as a ' +
            'fallback; a person seeing it would read an ordinary before/after value pair, ' +
            'identical in kind to `DiffFromTo` on the `DiffFromTo` page, and would have no way to ' +
            'know the type-specific renderer that should be here is missing.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>A stronger finding: `FallbackDiff` may be unreachable through the real ' +
            'pipeline for any schema-declared field.</b></summary>',
          '',
          "Reading `resolveDiffComponent.ts`, `defaultComponents.ts`, and `@sanity/schema`'s " +
            "`coreTypes.ts` together suggests this. `resolveDiffComponent` walks a type's `.type` " +
            'chain checking `defaultComponents[name]` at each step, then falls back to ' +
            '`defaultComponents[originalType.jsonType]`. Every intrinsic Sanity type resolves to ' +
            'one of five `jsonType`s (`coreTypes.ts`), and `defaultComponents` covers every leaf ' +
            'case that matters: `string`/`number`/`boolean`/`date`/`datetime` directly, plus ' +
            '`block`/`file`/`image`/`slug`/`reference`/`crossDatasetReference` by name, and ' +
            'string-family types with no direct name match (`email`, `url`, `telephone`, `text`) ' +
            'still resolve through the final `jsonType` fallback, since they are `jsonType: ' +
            "'string'`. `object`/`array` jsonTypes never need an entry at all: " +
            '`buildChangeList.ts` recurses into `buildObjectChangeList`/`buildArrayChangeList` ' +
            'for them instead of ever constructing a leaf `FieldChangeNode`. That leaves exactly ' +
            'one place a real `diffComponent` becomes `undefined` on purpose: ' +
            '`buildChangeList.ts` line 352, `diffComponent: error ? undefined : component`, when ' +
            'the stored value does not match its schema type, and that is precisely the case ' +
            '`FieldChange.tsx` intercepts one line earlier (`change.error ? <ValueError .../> : ' +
            '<DiffComponent .../>`), so `DiffComponent` is never even evaluated when ' +
            '`diffComponent` is `undefined` for that reason either. The `FallbackDiff` story ' +
            'below only exists because it is mounted directly, the same "reach a branch through ' +
            'an impossible value" allowance the sibling pages use for their own dead branches, a ' +
            '`seo` diff handed to `FallbackDiff` as though `StringFieldDiff`/objects-recurse ' +
            'never intervened. It is evidence about the code, not about anything a person using ' +
            'Review Changes will ever see.',
          '',
          '</details>',
          '',
          '> **Why it matters:** the two states meaning there is nothing to show are ' +
            'distinguished by a card tone alone, the same colour-only pattern this program keeps ' +
            'finding elsewhere (a presence dot, a status tone). And the renderer meant to catch a ' +
            'field type with no diff renderer appears to be defensive code with no live caller: ' +
            'reassuring in one sense, since nothing is silently showing raw JSON to an editor, ' +
            'and a maintenance cost in another, since a whole component exists to guard a branch ' +
            'nothing can reach.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:change-visibility',
    'pattern:error-recovery',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

// ── NoChanges ─────────────────────────────────────────────────────────────

/**
 * The single return in `NoChanges.tsx`: a title plus a muted description, no card, no tone,
 * no icon. This is what a person sees the moment they open Review Changes on a document with
 * no edits since the compared revision - `ChangeList` renders it whenever the root change list
 * comes back empty AND the list is at the document root
 * (`ChangeList.tsx`: `changes.length === 0 ? (isRoot ? <NoChanges /> : null)`).
 */
export const NoChangesDefault: Story = {
  name: 'NoChanges',
  render: () => (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      <NoChanges />
    </Card>
  ),
}

// ── ChangesError ─────────────────────────────────────────────────────────

/**
 * The default branch: `error` is a plain `Error`, not a `MissingSinceDocumentError`. The card
 * shows the same two generic lines every time - "Something went wrong" / "We're unable to load
 * the changes for this document." - regardless of what the underlying error actually says.
 * `error.message` is read nowhere in the component; whatever the real cause was (a network
 * failure, a permissions error, a malformed response) is discarded before it reaches the editor.
 */
export const ChangesErrorGeneric: Story = {
  name: 'ChangesError - generic error',
  render: () => (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      <ChangesError error={new Error('Failed to fetch document changes')} />
    </Card>
  ),
}

/**
 * The one special-cased branch: `error instanceof MissingSinceDocumentError` adds a third
 * paragraph naming the specific revision id and explaining why (history retention). This is
 * the only place in the four "not a normal diff" states that tells you anything concrete about
 * what went wrong - every other error path in this group is generic.
 */
export const ChangesErrorMissingRevision: Story = {
  name: 'ChangesError - revision not found',
  render: () => (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      <ChangesError error={new MissingSinceDocumentError('rev-2026-01-14T09-22-00Z')} />
    </Card>
  ),
}

// ── ValueError ───────────────────────────────────────────────────────────

/**
 * `getValueError` (`field/validation/index.ts`) has exactly one branch that produces a
 * `FieldValueError`, and it sets exactly one `messageKey`:
 * `changes.error.incorrect-type-message`, "Value error: Value is of type X, expected Y." There
 * is no second message this component can ever show - only `expectedType`/`actualType` vary.
 * Reached from `FieldChange.tsx`: `{change.error ? <ValueError .../> : <DiffComponent .../>}`,
 * one field inside an otherwise ordinary change list, not a replacement for the whole panel.
 */
export const ValueErrorDefault: Story = {
  name: 'ValueError - stored value does not match its schema',
  render: () => {
    const error: FieldValueError = {
      messageKey: 'changes.error.incorrect-type-message',
      expectedType: 'string',
      actualType: 'number',
      value: 42,
    }
    return (
      <Card border padding={3} radius={0} style={{maxWidth: 420}}>
        <ValueError error={error} />
      </Card>
    )
  },
}

// ── FallbackDiff ─────────────────────────────────────────────────────────

function FallbackDiffHarness() {
  const schema = useSchema()
  const articleType = schema.get('article') as ObjectSchemaType
  const seoField = articleType.fields.find((f) => f.name === 'seo')!
  const diff = useMemo(
    () =>
      fieldArticleDiff(
        {seo: {_type: 'seo', metaTitle: 'The Golden Notebook - overview', noIndex: false}},
        {seo: {_type: 'seo', metaTitle: 'The Waves - a reading guide', noIndex: true}},
      ),
    [],
  )
  return (
    <Card border padding={3} radius={0} style={{maxWidth: 480}}>
      <FallbackDiff
        diff={diff.fields.seo as ObjectDiff}
        schemaType={seoField.type as ObjectSchemaType}
      />
    </Card>
  )
}

/**
 * Mounted directly, bypassing `FieldChange`'s dispatch - the same "reach a branch through an
 * impossible value" move the sibling pages use for their own dead code, and labelled the same
 * way: this is evidence about `FallbackDiff.tsx` in isolation, not about anything the real
 * pipeline ever hands it (see the component docblock's finding above - a real `seo` object diff
 * would resolve through `buildObjectChangeList`'s recursion long before reaching this
 * component). What you see is `DiffFromTo` plus the generic `Preview` component - a before/after
 * value pair with no label distinguishing it from a "real" diff renderer.
 */
export const FallbackDiffDefault: Story = {
  name: 'FallbackDiff - forced render (unreachable in practice)',
  render: () => <FallbackDiffHarness />,
}

// ── MetaInfo ─────────────────────────────────────────────────────────────

/**
 * The everyday shape: an icon, a title, and a line of content underneath - this is what
 * `FileFieldDiff` and `ImagePreview` both build their asset headers from (`icon={DocumentIcon}`
 * / `icon={ImageIcon}`, `title={originalFilename}`, size or dimensions as `children`).
 */
export const MetaInfoWithIcon: Story = {
  name: 'MetaInfo - title, icon, content',
  render: () => (
    <Card border padding={2} radius={0} style={{maxWidth: 360}}>
      <MetaInfo title="launch-brief.pdf" icon={DocumentIcon}>
        128 KB
      </MetaInfo>
    </Card>
  ),
}

/**
 * `markRemoved`: both the title and the icon switch `forwardedAs` to `del`, so the native
 * strikethrough comes from the browser's own `<del>` styling, not a custom rule. This is the
 * "from" side of a removed image or file in a diff - compare with the icon-and-title story
 * above, which is the "to" side of the same kind of change.
 */
export const MetaInfoRemoved: Story = {
  name: 'MetaInfo - markRemoved (the "from" side of a removal)',
  render: () => (
    <Card border padding={2} radius={0} style={{maxWidth: 360}}>
      <MetaInfo title="launch-brief-draft.pdf" icon={DocumentIcon} markRemoved>
        96 KB
      </MetaInfo>
    </Card>
  ),
}

/** No `icon` prop: the icon column simply does not render (`{Icon && <Box>...</Box>}`) rather
 * than reserving its space, so the title sits flush left instead of indented to align with a
 * sibling row that does have one. */
export const MetaInfoNoIcon: Story = {
  name: 'MetaInfo - no icon supplied',
  render: () => (
    <Card border padding={2} radius={0} style={{maxWidth: 360}}>
      <MetaInfo title="Untitled">no icon on this row</MetaInfo>
    </Card>
  ),
}

/**
 * `textOverflow="ellipsis"` is set on both the title and the content text, so a long original
 * filename (a real thing - nobody names their upload for a 280px column) truncates with an
 * ellipsis rather than wrapping or overflowing the card.
 */
export const MetaInfoOverflowingTitle: Story = {
  name: 'MetaInfo - overflowing title',
  render: () => (
    <Card border padding={2} radius={0} style={{maxWidth: 280}}>
      <MetaInfo
        title="a-genuinely-long-original-filename-nobody-would-rename-before-uploading.pdf"
        icon={DocumentIcon}
      >
        2.1 MB, uploaded from a folder with an equally long path
      </MetaInfo>
    </Card>
  ),
}

// ── ChangeBreadcrumb ─────────────────────────────────────────────────────

const annotation: Annotation = {author: AUTHOR, timestamp: '2026-07-27T08:00:00.000Z'}
const movedSegment: FromToIndex = {hasMoved: true, fromIndex: 3, toIndex: 1, annotation}

/** A change with `showIndex: false` (only `.showIndex` is read by `ChangeBreadcrumb`; the rest
 * of `FieldChangeNode` is irrelevant to this renderer, so the cast supplies exactly what it
 * consumes, the same fixture pattern `ChangeTitleSegment`'s own page uses for its literal
 * `FromToIndex` arguments). */
const changeShowIndex = (showIndex: boolean) => ({showIndex}) as FieldChangeNode

/** Field names only. Every segment is a string, so `showSegment` is `true` unconditionally and
 * `change` is never consulted - this is what a breadcrumb over an ordinary object field looks
 * like: `Article › SEO`. */
export const ChangeBreadcrumbFieldPathOnly: Story = {
  name: 'ChangeBreadcrumb - field path only',
  render: () => {
    const titlePath: ChangeTitlePath = ['Article', 'SEO']
    return (
      <Card border padding={2} radius={0} style={{maxWidth: 320}}>
        <ChangeBreadcrumb titlePath={titlePath} change={changeShowIndex(true)} />
      </Card>
    )
  },
}

/**
 * `showIndex: true`: the array-position segment survives the `showSegment` filter and renders
 * alongside the field name - "Tags › #2 ↑2", the position and direction glyph from
 * `ChangeTitleSegment`'s own moved-item branch.
 */
export const ChangeBreadcrumbIndexShown: Story = {
  name: 'ChangeBreadcrumb - array index shown (showIndex: true)',
  render: () => {
    const titlePath: ChangeTitlePath = ['Tags', movedSegment]
    return (
      <Card border padding={2} radius={0} style={{maxWidth: 320}}>
        <ChangeBreadcrumb titlePath={titlePath} change={changeShowIndex(true)} />
      </Card>
    )
  },
}

/**
 * The identical `titlePath` as the story above, only `change.showIndex` flipped to `false`.
 * `showSegment = typeof titleSegment === 'string' || !change || change.showIndex` fails for the
 * `FromToIndex` segment, so it is filtered out entirely rather than shown collapsed or
 * placeholder-ed - the breadcrumb reads "Tags" alone, silently missing the position information
 * the sibling story shows for the exact same underlying change. Put the two side by side.
 */
export const ChangeBreadcrumbIndexHidden: Story = {
  name: 'ChangeBreadcrumb - array index hidden (showIndex: false)',
  render: () => {
    const titlePath: ChangeTitlePath = ['Tags', movedSegment]
    return (
      <Card border padding={2} radius={0} style={{maxWidth: 320}}>
        <ChangeBreadcrumb titlePath={titlePath} change={changeShowIndex(false)} />
      </Card>
    )
  },
}

// ── Event ────────────────────────────────────────────────────────────────

const EVENT_TIMESTAMP = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago

const editSingle: EditDocumentVersionEvent = {
  id: 'ev-edit-1',
  type: 'editDocumentVersion',
  timestamp: EVENT_TIMESTAMP,
  author: fixtureUsers[0].id,
  documentVariantType: 'draft',
  documentId: 'article-1',
  contributors: [fixtureUsers[0].id],
  revisionId: 'rev-1',
  transactions: [
    {
      type: 'editTransaction',
      author: fixtureUsers[0].id,
      timestamp: EVENT_TIMESTAMP,
      revisionId: 'rev-1',
    },
  ],
}

const editMultiple: EditDocumentVersionEvent = {
  ...editSingle,
  id: 'ev-edit-2',
  contributors: [fixtureUsers[0].id, fixtureUsers[1].id, fixtureUsers[2].id],
}

const publishedWithRelease: PublishDocumentVersionEvent = {
  id: 'ev-pub-1',
  type: 'publishDocumentVersion',
  timestamp: EVENT_TIMESTAMP,
  author: fixtureUsers[0].id,
  documentVariantType: 'published',
  documentId: 'article-1',
  revisionId: 'rev-2',
  versionId: `versions.rAsap.article-1`,
  releaseId: 'rAsap',
  publishCause: 'release.publish',
  contributors: [fixtureUsers[0].id, fixtureUsers[1].id],
  release: fixtureReleases[0] as ReleaseDocument,
}

const publishedNoRelease: PublishDocumentVersionEvent = {
  id: 'ev-pub-2',
  type: 'publishDocumentVersion',
  timestamp: EVENT_TIMESTAMP,
  author: fixtureUsers[0].id,
  documentVariantType: 'published',
  documentId: 'article-1',
  revisionId: 'rev-3',
  versionId: 'draft-article-1',
  publishCause: 'document.publish',
  // No `release`: this is the plain-draft-publish branch, not a release publish.
}

/**
 * `showChangesBy="tooltip"` (the timeline's own usage in `EventTimelineItem`): one contributor,
 * so the hover-only "changes by" avatar stack carries a single name - present, but doing very
 * little work for a solo edit.
 */
export const EventEditSingleContributor: Story = {
  name: 'Event - edited by one person (tooltip)',
  render: () => (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      <Event event={editSingle} showChangesBy="tooltip" />
    </Card>
  ),
}

/**
 * `showChangesBy="inline"` (`DiffTooltip`'s own usage, inside an annotation popover): three
 * contributors, so the "Changes by" block renders open underneath the event line rather than
 * waiting for a hover - the right call inside a tooltip that is already a hover surface itself.
 */
export const EventEditMultipleContributors: Story = {
  name: 'Event - edited by several (inline)',
  render: () => (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      <Event event={editMultiple} showChangesBy="inline" />
    </Card>
  ),
}

/**
 * `isPublishDocumentVersionEvent(event) && documentVariantType === 'published'` with a real
 * `event.release`: the label gets a `VersionInlineBadge` naming the release ("Hotfix launch"),
 * toned by `getReleaseTone`.
 */
export const EventPublishedWithRelease: Story = {
  name: 'Event - published as part of a release',
  render: () => (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      <Event event={publishedWithRelease} showChangesBy="tooltip" />
    </Card>
  ),
}

/**
 * The same branch with `event.release` absent - an ordinary document publish, not a release
 * publish. Falls to the caution-toned "Draft" badge instead of a release name. Put beside the
 * story above: the only visible difference is the badge's text and tone.
 */
export const EventPublishedNoRelease: Story = {
  name: 'Event - published, no release (draft badge)',
  render: () => (
    <Card border padding={3} radius={0} style={{maxWidth: 420}}>
      <Event event={publishedNoRelease} showChangesBy="tooltip" />
    </Card>
  ),
}
