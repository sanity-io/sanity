import {type ObjectSchemaType, type Path} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo} from 'react'

import {GetFormValueProvider} from '../../../../packages/sanity/src/core/form/contexts/GetFormValue'
import {ArrayOfObjectsInputMember} from '../../../../packages/sanity/src/core/form/members/array/ArrayOfObjectsInputMember'
import {ArrayOfObjectsInputMembers} from '../../../../packages/sanity/src/core/form/members/array/ArrayOfObjectsInputMembers'
import {IncompatibleItemType} from '../../../../packages/sanity/src/core/form/members/array/IncompatibleItemType'
import {ArrayOfPrimitivesItem} from '../../../../packages/sanity/src/core/form/members/array/items/ArrayOfPrimitivesItem'
import {MemberItemError} from '../../../../packages/sanity/src/core/form/members/array/MemberItemError'
import {
  type ArrayOfObjectsMember,
  type ArrayOfPrimitivesMember,
  type FieldMember,
} from '../../../../packages/sanity/src/core/form/store/types/members'
import {useFormState} from '../../../../packages/sanity/src/core/form/store/useFormState'
import {FormCallbacksProvider} from '../../../../packages/sanity/src/core/form/studio/contexts/FormCallbacks'
import {PresenceProvider} from '../../../../packages/sanity/src/core/form/studio/contexts/Presence'
import {ValidationProvider} from '../../../../packages/sanity/src/core/form/studio/contexts/Validation'
import {
  type RenderArrayOfObjectsItemCallback,
  type RenderArrayOfPrimitivesItemCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../../packages/sanity/src/core/form/types/renderCallback'
// Real components from real paths (org contract §8): the six unstoried pieces that
// assemble an array's members (excluding the two files with a live story already:
// `ArrayOfObjectsInput.tsx` itself, covered by `ArrayInput.stories.tsx`).
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {type FormNodePresence} from '../../../../packages/sanity/src/core/presence/types'
import {WithStudioProviders} from '../../lib/testProvider'
import {OverlayFrame} from '../overlays/OverlayFrame'

/* ── Why this page builds its own harness ────────────────────────────────────
   `ObjectInputMember`/`MemberField` (the sibling pages) run through `FormBuilderHarness`
   and let the real, live `FormBuilder` recursion call the dispatcher under discussion for
   them. That technique does not work here: `ArrayOfObjectsInputMember` and
   `ArrayOfObjectsInputMembers` have no caller anywhere in `packages/sanity/src` other than
   each other and the `members/index.ts` barrel (confirmed by grep). The real array-of-objects
   list (`VirtualizedArrayList.tsx:260`) calls `ArrayOfObjectsItem` directly and its own local
   `List/ErrorItem.tsx` for the error kind; the other place that renders a single array member
   in isolation, `FormInput.tsx:229-244` (used to render one input by absolute path), calls
   `ArrayOfObjectsItem` and `MemberItemError` directly too, reimplementing the same `kind ===
   'item' | 'error'` check inline rather than going through this dispatcher. So there is no
   live render tree that will ever hand `ArrayOfObjectsInputMember` a member for us to
   piggyback on.

   The fixture is still real, not fabricated: `useResolvedArrayMembers` below calls the real
   `useFormState` (the same hook `FormBuilderHarness` calls) against a real schema and document,
   and reads the resolved `ArrayOfObjectsMember[]` / `ArrayOfPrimitivesMember[]` off the array
   field's own form node (`store/types/nodes.ts:178,191`). What's fabricated is only the
   *display* glue below the dispatch line: `renderItem` is a minimal stand-in (title + raw
   value), because nothing in the shipped app supplies this component a real one to borrow.
   Opening an item to edit its fields recurses through `MemberField`/`ObjectInputMember`,
   already storied on their own pages, so it is not reimplemented here. */

const linkType = {
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    {name: 'label', title: 'Label', type: 'string'},
    {name: 'url', title: 'URL', type: 'string'},
  ],
}

const schemaTypes = [
  linkType,
  {
    name: 'linksHost',
    title: 'Links host',
    type: 'document',
    fields: [{name: 'links', title: 'Further reading', type: 'array', of: [{type: 'link'}]}],
  },
  {
    name: 'tagsHost',
    title: 'Tags host',
    type: 'document',
    fields: [{name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}]}],
  },
]

const EMPTY_PATH: Path = []

/** One valid `link` item: a document as it would come back from the Content Lake today. */
const validLinksDocument = {
  links: [
    {
      _key: 'l1',
      _type: 'link',
      label: 'Borges: Collected Fictions',
      url: 'https://openlibrary.org/works/OL1234567W',
    },
  ],
}

/**
 * A valid `link` item next to one whose `_type`, `legacyCitation`, is no longer declared on
 * `links`' `of` list. This is exactly what "an array item whose type was removed from the
 * schema" looks like on disk: the document was never touched, the schema's `of` list changed
 * underneath it.
 */
const staleTypeLinksDocument = {
  links: [
    {
      _key: 'l1',
      _type: 'link',
      label: 'Borges: Collected Fictions',
      url: 'https://openlibrary.org/works/OL1234567W',
    },
    {
      _key: 'l2',
      _type: 'legacyCitation',
      label: 'A citation format retired from the schema',
    },
  ],
}

/** Two valid strings, so the resolver hands `tags` two ordinary `kind: 'item'` members. */
const validTagsDocument = {tags: ['fiction', 'mystery']}

/**
 * A valid string next to `42`: `getPrimitiveItemType` (`store/utils/getItemType.ts:12-21`)
 * matches an item's resolved type name or `jsonType` against `tags`' `of` list (`string` only);
 * a bare number matches neither, so the resolver hands back the same `ArrayItemError` shape
 * the object side uses.
 */
const invalidTagsDocument = {tags: ['fiction', 42]}

/**
 * Calls the real `useFormState` (the hook `FormBuilderHarness` also calls) against a real
 * schema and document, then reads the resolved members off the named array field's own form
 * node. Real resolution, not a hand-built member: this is the only way to get one, since
 * nothing in the shipped app currently asks `useFormState` for these members on this
 * dispatcher's behalf.
 */
function useResolvedArrayMembers<M>(options: {
  documentType: string
  fieldName: string
  document: Record<string, unknown>
}): M[] | undefined {
  const {documentType, fieldName, document} = options
  const schema = useSchema()
  const schemaType = schema.get(documentType) as ObjectSchemaType

  const documentValue = useMemo(
    () => ({
      _id: `storybook-${documentType}`,
      _type: documentType,
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'storybook-rev-1',
      ...document,
    }),
    [documentType, document],
  )

  const formState = useFormState({
    schemaType,
    documentValue,
    comparisonValue: null,
    openPath: EMPTY_PATH,
    focusPath: EMPTY_PATH,
    perspective: 'published',
    presence: [],
    validation: [],
    hasUpstreamVersion: false,
  })

  const fieldMember = formState?.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === fieldName,
  )
  return (fieldMember?.field as unknown as {members?: M[]} | undefined)?.members
}

const noop = () => null
const renderFieldNoop = noop as unknown as RenderFieldCallback
const renderInputNoop = noop as unknown as RenderInputCallback
const renderPreviewNoop = noop as unknown as RenderPreviewCallback

/**
 * The story's own stand-in for a closed item row: title plus the raw resolved value. Not the
 * Studio's real row chrome (that is `List/PreviewItem.tsx`, out of this page's scope, and it
 * has its own real preview/tone logic) - just enough to show that the dispatcher fired and
 * what real data it was carrying.
 */
const renderObjectItemDemo: RenderArrayOfObjectsItemCallback = (itemProps) => (
  <Card
    border
    padding={3}
    radius={2}
    tone={itemProps.validation.length > 0 ? 'critical' : 'default'}
  >
    <Stack gap={2}>
      <Text size={1} weight="medium">
        {itemProps.schemaType.title}
      </Text>
      <Text size={1} muted style={{fontFamily: 'monospace'}}>
        {JSON.stringify(itemProps.value)}
      </Text>
    </Stack>
  </Card>
)

const renderPrimitiveItemDemo: RenderArrayOfPrimitivesItemCallback = (itemProps) => (
  <Card
    border
    padding={3}
    radius={2}
    tone={itemProps.validation.length > 0 ? 'critical' : 'default'}
  >
    <Text size={1}>{String(itemProps.value)}</Text>
  </Card>
)

/**
 * The three contexts the item renderers read, supplied together.
 *
 * `ArrayOfObjectsItem` and `ArrayOfPrimitivesItem` call `useChildValidation`,
 * `useChildPresence` and `useFormCallbacks`, each of which throws a bare
 * "Form context not provided" when its provider is missing. `formBuilderHarness.tsx` documents
 * the presence one in its own docblock and supplies all three, but this page cannot route through
 * that harness: the dispatcher under study has no live caller, so there is no real form tree to
 * mount it inside. Supplying the three directly is the smallest honest substitute.
 */
function WithFormContexts({
  children,
  document,
}: {
  children: React.ReactNode
  document?: Record<string, unknown>
}) {
  return (
    <GetFormValueProvider value={document as never}>
      <FormCallbacksProvider
        onChange={noopCallback}
        onPathBlur={noopCallback}
        onPathFocus={noopCallback}
        onPathOpen={noopCallback}
        onFieldGroupSelect={noopCallback}
        onSetPathCollapsed={noopCallback}
        onSetFieldSetCollapsed={noopCallback}
      >
        <ValidationProvider validation={EMPTY_VALIDATION}>
          <PresenceProvider presence={EMPTY_PRESENCE}>{children}</PresenceProvider>
        </ValidationProvider>
      </FormCallbacksProvider>
    </GetFormValueProvider>
  )
}

const noopCallback = () => undefined
const EMPTY_VALIDATION: never[] = []
const EMPTY_PRESENCE: FormNodePresence[] = []

function ObjectItemDemo({document}: {document: Record<string, unknown>}) {
  const members = useResolvedArrayMembers<ArrayOfObjectsMember>({
    documentType: 'linksHost',
    fieldName: 'links',
    document,
  })
  if (!members) return null
  return (
    <WithFormContexts document={document}>
      <Stack gap={2} style={{maxWidth: 480}}>
        <ArrayOfObjectsInputMembers
          members={members}
          renderField={renderFieldNoop}
          renderInput={renderInputNoop}
          renderItem={renderObjectItemDemo}
          renderPreview={renderPreviewNoop}
        />
      </Stack>
    </WithFormContexts>
  )
}

function PrimitiveItemDemo({document}: {document: Record<string, unknown>}) {
  const members = useResolvedArrayMembers<ArrayOfPrimitivesMember>({
    documentType: 'tagsHost',
    fieldName: 'tags',
    document,
  })
  if (!members) return null
  return (
    <WithFormContexts document={document}>
      <Stack gap={2} style={{maxWidth: 480}}>
        {members.map((member) =>
          member.kind === 'item' ? (
            <ArrayOfPrimitivesItem
              key={member.key}
              member={member}
              renderItem={renderPrimitiveItemDemo}
              renderInput={renderInputNoop}
            />
          ) : (
            <MemberItemError key={member.key} member={member} />
          ),
        )}
      </Stack>
    </WithFormContexts>
  )
}

/**
 * The fifth branch: after `kind === 'item'` and `kind === 'error'`, `ArrayOfObjectsInputMember`
 * falls through to a `//@ts-expect-error`-suppressed `console.warn` and `return null`
 * (`ArrayOfObjectsInputMember.tsx:59-61`). `ArrayOfObjectsMember` is a closed union of exactly
 * those two kinds (`store/types/members.ts:14`), so, same as the object-side `ObjectInputMember`
 * page, TypeScript itself marks this line unreachable. Forced past the type system to show
 * what it actually does: nothing renders, a warning goes to the console.
 */
function UnhandledKindDemo() {
  const bogusMember = {kind: 'bogus', key: 'x'} as unknown as ArrayOfObjectsMember
  return (
    <Card border padding={3} radius={0} tone="critical" style={{maxWidth: 460}}>
      <Stack gap={3}>
        <Text size={1}>
          Renders nothing below this line. Open the console: a warning was logged.
        </Text>
        <WithFormContexts>
          <ArrayOfObjectsInputMember
            member={bogusMember}
            renderField={renderFieldNoop}
            renderInput={renderInputNoop}
            renderItem={renderObjectItemDemo}
            renderPreview={renderPreviewNoop}
          />
        </WithFormContexts>
      </Stack>
    </Card>
  )
}

function Row({label, note, children}: {label: string; note: string; children: React.ReactNode}) {
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

const meta: Meta = {
  title: 'Forms & Input/Array Members',
  parameters: {
    docs: {
      description: {
        component: [
          'The dispatcher this page documents compiles, is exported, and renders correctly, and ' +
            'nothing in the shipped Studio ever calls it: the array list that actually renders ' +
            'every day reimplements the same check inline and bypasses it entirely.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/members/array/` (`ArrayOfObjectsInputMember.tsx`, `ArrayOfObjectsInputMembers.tsx`, `MemberItemError.tsx`, `IncompatibleItemType.tsx`) and `.../array/items/` (`ArrayOfObjectsItem.tsx`, `ArrayOfPrimitivesItem.tsx`), six files, all exported from `members/index.ts`, none module-local |',
          '| Tier | CORE. Every item in every array of objects or primitives, in every document, resolves through this machinery |',
          '| Audit | 🟡 needs-work (`type-dispatch`, `duplicate-logic`). The dispatcher pair for the object-array side is dead weight in the shipped app, and the one leaf it delegates to for errors has a drifted duplicate on the path that actually ships |',
          '| Patterns | `type-dispatch` · `duplicate-logic` |',
          '',
          'Both array member unions are closed to exactly two kinds, `ArrayOfObjectsMember = ' +
            'ArrayOfObjectsItemMember | ArrayItemError` and `ArrayOfPrimitivesMember = ' +
            'ArrayOfPrimitivesItemMember | ArrayItemError` (`store/types/members.ts:14,19`). ' +
            '`ArrayOfObjectsInputMember` switches on `member.kind`: `item` renders ' +
            '`ArrayOfObjectsItem`, `error` renders `MemberItemError`. ' +
            '`ArrayOfObjectsInputMembers` just maps an array of members through that dispatcher. ' +
            '`MemberItemError` in turn switches on `member.error.type`: today that is only ever ' +
            '`INVALID_ITEM_TYPE` (see the second finding below), which renders ' +
            '`IncompatibleItemType`, a popover button showing the incompatible value as JSON. ' +
            'There is no equivalent dispatcher for arrays of primitives; `ArrayOfPrimitivesInput.tsx` ' +
            'has always checked `member.kind` inline itself (`ArrayOfPrimitivesInput.tsx:211-231`) ' +
            'and calls `ArrayOfPrimitivesItem` or its own `ErrorItem` directly.',
          '',
          '**What reading it turned up.**',
          '',
          '<details><summary><b>`ArrayOfObjectsInputMember` and `ArrayOfObjectsInputMembers` have no caller anywhere in `packages/sanity/src`, other than each other and the `members/index.ts` barrel export.</b></summary>\n\n' +
            'Grepped both names across the whole package: every hit is one of the two files ' +
            'themselves or the barrel. The real array-of-objects list ' +
            '(`inputs/arrays/ArrayOfObjectsInput/List/VirtualizedArrayList.tsx:260`) renders ' +
            "`ArrayOfObjectsItem` directly for `kind: 'item'` and its own local `ErrorItem` " +
            "(`List/ErrorItem.tsx`) for `kind: 'error'`, never going through this dispatcher. " +
            '`components/FormInput.tsx:229-244`, the other place a single array member gets ' +
            'rendered in isolation, used to draw one input at an absolute path, reimplements the ' +
            'identical two-branch `member.kind` check inline and calls `ArrayOfObjectsItem` / ' +
            '`MemberItemError` directly rather than calling `ArrayOfObjectsInputMember`. Contrast ' +
            "the object side: `ObjectInputMember` (this page's sibling) is genuinely live, reached " +
            'via `ObjectInputMembers` from `inputs/ObjectInput/ObjectInput.tsx`. The array-of-objects ' +
            'dispatcher pair has no such caller. It compiles, it is exported, and (per this page) ' +
            'it renders correctly, it is just never asked to.\n\n</details>',
          '',
          "<details><summary><b>`MemberItemError`'s own `error.type` dispatch is narrower than it looks, and unlike the array side's dead branch, its dead branch is not silent.</b></summary>\n\n" +
            '`ArrayItemError.error` (`store/types/memberErrors.ts:141-146`) is typed as exactly ' +
            '`InvalidItemTypeError`, not a union, so the `else` in `MemberItemError.tsx:10-13` ' +
            "(`t('inputs.array.error.unexpected-error', ...)`) is unreachable by the type system " +
            "today, the same way `ArrayOfObjectsInputMember`'s own fallback is. But if it were " +
            'ever reached, a future error type added to the union without a matching branch here, ' +
            'it prints visible text, not nothing. Across everything on this page, the only place a ' +
            "real or forced failure renders as nothing at all is `ArrayOfObjectsInputMember`'s own " +
            "fifth branch (see `Unhandled`, the first finding's dead code), never " +
            '`MemberItemError`.\n\n</details>',
          '',
          "<details><summary><b>`IncompatibleItemType` (this directory) is a near-duplicate of `inputs/arrays/ArrayOfObjectsInput/List/IncompatibleItemType.tsx`, the copy actually reached by the shipped list and by `ArrayOfPrimitivesInput`'s `ErrorItem`, and the two have drifted.</b></summary>\n\n" +
            'This copy\'s popover repeats the trigger button\'s own "type is incompatible" line as ' +
            'the first paragraph inside the popover itself, before the title; the `List/` copy ' +
            'opens straight with the title, no repeated prompt. Since this copy is reached only ' +
            'through `MemberItemError` (the finding above), which in turn is reached only through ' +
            "`FormInput.tsx`'s path-scoped render (the first finding), the drift is real content, " +
            'in the one place this copy is ever seen, not a difference nobody ' +
            'encounters.\n\n</details>',
          '',
          '<details><summary><b>`ArrayOfObjectsItem` is the one dispatch target with a foot in both worlds; `ArrayOfPrimitivesItem` has exactly one caller and no dispatcher layer ever grew up around it.</b></summary>\n\n' +
            'It is called by the dead dispatcher (the first finding above), by the live ' +
            '`VirtualizedArrayList.tsx:260`, and by `FormInput.tsx:234`. `ArrayOfPrimitivesItem` ' +
            'has exactly one caller, `ArrayOfPrimitivesInput.tsx`: the primitives side never got ' +
            'an `ArrayOfObjectsInputMember` equivalent, so it never accumulated an unused middle ' +
            'layer either.\n\n</details>',
          '',
          "**Answering the brief's questions directly.**",
          '',
          '- Every declared member kind: handled, or silently dropped? Both unions are closed to ' +
            'exactly two kinds (`item`, `error`) and `ArrayOfObjectsInputMember` handles both. ' +
            'Nothing is silently dropped for a kind either union actually declares.',
          '- An array item whose type was removed from the schema: what renders? ' +
            '`getItemType`/`getPrimitiveItemType` (`store/utils/getItemType.ts`) fail to match the ' +
            "item's resolved type name against the array's current `of` list, so the resolver " +
            "hands back `kind: 'error'`, `error.type: 'INVALID_ITEM_TYPE'` " +
            '(`store/formState.ts:1206-1219` for objects, `:1303-1315` for primitives), the ' +
            'IncompatibleItemType popover button, JSON value and all. See `ObjectErrorKind` / ' +
            '`PrimitiveErrorKind` below, both driven by a real document with a stale `_type`, not ' +
            'a fabricated error object.',
          '- Is a failed-validation item distinguishable from one still resolving? Not by anything ' +
            'in this directory. `ArrayOfObjectsItemMember` / `ArrayOfPrimitivesItemMember` ' +
            '(`store/types/members.ts:24,45`) carry no pending/loading field at all; ' +
            '`ArrayOfObjectsItem` / `ArrayOfPrimitivesItem` forward whatever `validation` markers ' +
            'happen to be attached to the item, verbatim, to whatever renders it. Structural ' +
            'resolution (`item` vs `error`) is synchronous; `validateDocument` is async and runs ' +
            'separately, at the document level. A freshly-resolved item with validation not yet ' +
            'computed and a genuinely valid item are the same shape here: there is no still-' +
            'checking state distinct from no-errors-found-yet.',
          '- Is there anywhere a failure renders as nothing at all? Yes, exactly one place, and it ' +
            "takes forcing: `ArrayOfObjectsInputMember`'s fifth branch (the first finding's dead " +
            'code, `//@ts-expect-error` and all), see `Unhandled`. Every reachable state, including ' +
            'the one real error kind, renders something visible.',
          '',
          '> **Why it matters:** a dispatcher can compile, export cleanly, and render every state ' +
            'correctly, and still be dead code if nothing in the shipped app calls it. The real ' +
            'array list bypasses this one and reimplements its two-branch check by hand, so the ' +
            'two copies are already free to drift, and one leaf they both eventually reach, the ' +
            'incompatible-type popover, already has.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:type-dispatch',
    'pattern:duplicate-logic',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/** All real branches on both member unions, plus the forced-unreachable fifth, stacked. */
export const ReturnMatrix: Story = {
  render: () => (
    <Stack gap={5} style={{maxWidth: 520}}>
      <Row label="object array, kind: 'item'" note="A single valid `link` item, resolved for real.">
        <ObjectItemDemo document={validLinksDocument} />
      </Row>
      <Row
        label="object array, kind: 'error' (INVALID_ITEM_TYPE)"
        note="A second link item carries `_type: legacyCitation`, no longer in `links`' `of` list."
      >
        <ObjectItemDemo document={staleTypeLinksDocument} />
      </Row>
      <Row label="primitives array, kind: 'item'" note="Two valid strings, resolved for real.">
        <PrimitiveItemDemo document={validTagsDocument} />
      </Row>
      <Row
        label="primitives array, kind: 'error' (INVALID_ITEM_TYPE)"
        note="A bare `42` in a `tags` field declared array-of-string."
      >
        <PrimitiveItemDemo document={invalidTagsDocument} />
      </Row>
      <Row
        label="unhandled kind on ArrayOfObjectsInputMember (dead branch)"
        note="Not reachable through any real schema. Forced past the type system to show the fallback."
      >
        <UnhandledKindDemo />
      </Row>
    </Stack>
  ),
}

/**
 * `member.kind === 'item'` on the object-array side: `ArrayOfObjectsInputMember` delegates to
 * `ArrayOfObjectsItem`, via `ArrayOfObjectsInputMembers` wrapping a one-member array. This
 * exact call chain has no caller in the shipped app (see finding 1) - the member is real
 * (resolved by `useFormState`), the wrapping is not something the Studio itself does.
 */
export const ObjectItemKind: Story = {
  name: "Object array, kind: 'item'",
  render: () => <ObjectItemDemo document={validLinksDocument} />,
}

/**
 * `member.kind === 'error'`, `error.type === 'INVALID_ITEM_TYPE'`: a `link` item plus a second
 * item whose `_type` (`legacyCitation`) is no longer declared on the field's `of` list - the
 * real shape of "an item whose type was removed from the schema". The resolver's own type
 * guard (`getItemType`, `store/formState.ts:1206-1219`) produces the error before any input
 * mounts; `ArrayOfObjectsInputMembers` renders the valid item and the error side by side from
 * one real document.
 */
export const ObjectErrorKind: Story = {
  name: "Object array, kind: 'error' (type removed from schema)",
  render: () => <ObjectItemDemo document={staleTypeLinksDocument} />,
}

/**
 * `member.kind === 'item'` on the primitives side: `ArrayOfPrimitivesItem` called directly,
 * since arrays of primitives never grew an `ArrayOfObjectsInputMember`-equivalent dispatcher -
 * `ArrayOfPrimitivesInput` has always branched on `member.kind` itself.
 */
export const PrimitiveItemKind: Story = {
  name: "Primitives array, kind: 'item'",
  render: () => <PrimitiveItemDemo document={validTagsDocument} />,
}

/**
 * `member.kind === 'error'` on the primitives side, same `ArrayItemError` shape and the same
 * `MemberItemError` component as the object side (finding 2) - the error type is shared
 * between both member unions. Here the mismatch is a bare `42` where `tags` declares
 * array-of-string, caught by `getPrimitiveItemType` (`store/utils/getItemType.ts:12-21`).
 */
export const PrimitiveErrorKind: Story = {
  name: "Primitives array, kind: 'error'",
  render: () => <PrimitiveItemDemo document={invalidTagsDocument} />,
}

/**
 * `IncompatibleItemType` in isolation, real `INVALID_ITEM_TYPE` value and all. Click the
 * button to open the popover: the first line inside it repeats the trigger's own "type is
 * incompatible" prompt before the title, unlike the near-duplicate that actually ships
 * (`inputs/arrays/ArrayOfObjectsInput/List/IncompatibleItemType.tsx`), which opens straight
 * with the title (finding 3). Same value as `ObjectErrorKind`, the leaf on its own.
 *
 * A human reviewer found this "rendering empty" on click with a horizontal scrollbar pinned to
 * the frame. Verified live (chrome devtools against the unfixed static build,
 * `iframe.html?id=forms-input-array-members--docs&viewMode=docs`).
 *
 * CORRECTED after a second look: my first pass read this as "fine at 1280x900, only clips
 * narrow" - that was wrong, caught by checking the popover's own natural size in `viewMode=story`
 * rather than trusting that it looked non-empty in docs mode. In story mode this popover resolves
 * `data-placement="right"` and renders its true, unclamped content at 329px
 * (`[data-ui="Popover"].scrollHeight`, matching `.getBoundingClientRect().height` exactly - full
 * prompt, title, description, bullet and the JSON code card). In docs mode at 1280x900, same
 * `right` placement, but `max-height` clamps to 67px - only the first line shows, which is why it
 * read as "empty" rather than merely cropped: at 20% of its needed height almost nothing survives.
 * The closed frame is 75px before opening, same shortfall class as `Array Functions`' primitives
 * story, just a bigger deficit (329px needed vs 78px there) because this popover's content is
 * much longer. Confirmed the fix lever the same way: forcing `.innerZoomElementWrapper` to 320px
 * (matching `OverlayFrame`'s own default `minHeight`) still clamped to 312px - 17px short of the
 * 329px need. 420px cleared it (`max-height: 412px`, popover rendered its full 329px). So this
 * story passes an explicit `minHeight={420}` to `OverlayFrame` rather than relying on the 320px
 * default the other two stories use. Not independently re-verified against a rebuild of this
 * exact change (see the Array Functions objects story's note on that same limit).
 */
export const IncompatibleItemTypePopover: Story = {
  name: 'IncompatibleItemType (leaf, note the drifted duplicate)',
  render: () => (
    <OverlayFrame minHeight={420}>
      <Card style={{maxWidth: 320}}>
        <IncompatibleItemType
          value={{
            _type: 'legacyCitation',
            _key: 'l2',
            label: 'A citation format retired from the schema',
          }}
        />
      </Card>
    </OverlayFrame>
  ),
}

/**
 * The branch after both `member.kind` checks on `ArrayOfObjectsInputMember`: a `console.warn`
 * and `return null`, reached only by a member kind the closed union has already ruled out.
 * The only place on this page - or, per finding 2, anywhere in this directory - where a
 * failure renders as nothing at all.
 */
export const Unhandled: Story = {
  render: () => <UnhandledKindDemo />,
}
