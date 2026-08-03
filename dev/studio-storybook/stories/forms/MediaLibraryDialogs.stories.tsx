import {type SanityClient} from '@sanity/client'
import {
  type Asset,
  type AssetSourceUploader,
  type AssetSourceUploadFile,
  type FileSchemaType,
  type ImageSchemaType,
  type ObjectSchemaType,
} from '@sanity/types'
import {Button as UIButton, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useEffect, useMemo, useRef, useState} from 'react'
import {NEVER} from 'rxjs'
import {MediaLibraryIdsContext} from 'sanity/_singletons'
import {waitFor, within} from 'storybook/test'

import {FormValueProvider} from '../../../../packages/sanity/src/core/form/contexts/FormValue'
import {EnsureMediaLibrary} from '../../../../packages/sanity/src/core/form/studio/assetSourceMediaLibrary/shared/EnsureMediaLibrary'
import {Iframe} from '../../../../packages/sanity/src/core/form/studio/assetSourceMediaLibrary/shared/Iframe'
import {OpenInSourceDialog} from '../../../../packages/sanity/src/core/form/studio/assetSourceMediaLibrary/shared/OpenInSourceDialog'
import {SelectAssetsDialog} from '../../../../packages/sanity/src/core/form/studio/assetSourceMediaLibrary/shared/SelectAssetsDialog'
// The file is `UploadAssetDialog.tsx` (no "s" in "Asset") but the export it declares is
// `UploadAssetsDialog` (with the "s") - a small, real naming mismatch between filename and export.
import {UploadAssetsDialog} from '../../../../packages/sanity/src/core/form/studio/assetSourceMediaLibrary/shared/UploadAssetDialog'
import {
  type AssetSelectionItem,
  type PluginPostMessage,
} from '../../../../packages/sanity/src/core/form/studio/assetSourceMediaLibrary/types'
// Real components from real paths (org contract §8): none of these five are surfaced through the
// `sanity` exports map - same idiom as `stories/media/VideoPreview.stories.tsx`, which stories a
// sibling of this same plugin-internals folder.
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {createMockSanityClient} from '../../../../packages/sanity/test/mocks/mockSanityClient'
import {WithStudioProviders} from '../../lib/testProvider'
// `OverlayFrame` lives in stories/overlays but is already imported cross-chapter elsewhere
// (`stories/beta/Announcements.stories.tsx`, `stories/status/RevertChanges.stories.tsx`) - the
// three dialogs here portal exactly the way its docblock describes (an unnamed, in-frame portal
// slot), so it is the right harness, not `lib/documentGroupInventoryFrame.tsx`'s `NamedPortalFrame`
// - see the meta docblock, "On the portal landmine", for why.
import {OverlayFrame} from '../overlays/OverlayFrame'

/* ── Fixture schema ───────────────────────────────────────────────────────
   One document type with three asset fields: a plain image, a plain file, and an image whose
   validation explicitly opts into `Rule.media(...)` - the one path that makes SelectAssetsDialog's
   validation banner reachable at all (see finding 5). */

const DOCUMENT_TYPE_NAME = 'pressPhotoDoc'

const schemaTypes = [
  {
    name: DOCUMENT_TYPE_NAME,
    title: 'Press photo',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'heroImage', title: 'Hero image', type: 'image'},
      {
        name: 'heroImageValidated',
        title: 'Hero image (validated)',
        type: 'image',
        // oxlint-disable-next-line no-explicit-any -- plain schema fixture, no Rule type import needed
        validation: (Rule: any) => Rule.media(() => 'This asset needs approval before use.'),
      },
      {name: 'attachment', title: 'Attachment', type: 'file'},
    ],
  },
]

function useDemoFieldType(fieldName: string): ImageSchemaType | FileSchemaType {
  const schema = useSchema()
  const docType = schema.get(DOCUMENT_TYPE_NAME) as ObjectSchemaType
  const field = docType.fields.find((f) => f.name === fieldName)
  return field?.type as ImageSchemaType | FileSchemaType
}

/** One client per client-behavior, same documented deviation `VideoPreview.stories.tsx` uses:
 * each story below is a different answer to a different backend call, so each needs its own
 * client rather than the file's single shared default. */
function withClient(client: ReturnType<typeof createMockSanityClient>) {
  return WithStudioProviders({
    config: {schema: {name: 'storybook', types: schemaTypes}},
    client: client as unknown as SanityClient,
  })
}

const defaultClient = createMockSanityClient()
const defaultDecorator = withClient(defaultClient)

const MEDIA_LIBRARY_IDS = {libraryId: 'lib_demo', organizationId: 'org_demo'}

/** `SelectAssetsDialog` reads `useFormValue([])` (SelectAssetsDialog.tsx:84) to build its
 * validation `parent`/`document` context - without a `FormValueProvider` ancestor that hook
 * throws ("must be used within a FormValueProvider"), not just returns `undefined`. This is the
 * host document the dialog believes it is attaching an asset to. */
const DEMO_DOCUMENT_VALUE = {
  _id: 'storybook-doc',
  _type: DOCUMENT_TYPE_NAME,
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
  title: 'Yosemite valley proofs',
}

/** Seeds `useMediaLibraryIds()` the way `MediaLibraryProvider` would once a library has resolved -
 * all five components here sit BELOW that gate, so this skips straight past `EnsureMediaLibrary`
 * for every story except `EnsureMediaLibrary`'s own. */
function WithMediaLibraryIds({children}: {children: ReactNode}) {
  return (
    <MediaLibraryIdsContext.Provider value={MEDIA_LIBRARY_IDS}>
      {children}
    </MediaLibraryIdsContext.Provider>
  )
}

/** Reopen affordance so a closed dialog doesn't leave an empty canvas - same convention
 * `stories/overlays/Dialog.stories.tsx` uses. */
function Reopen({onClick}: {onClick: () => void}) {
  return <UIButton text="Reopen" onClick={onClick} />
}

const EMPTY_FRAME_STYLE = {
  borderStyle: 'dashed' as const,
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 12,
  minWidth: 240,
}

const meta: Meta = {
  title: 'Forms & Input/Media Library Dialogs',
  parameters: {
    // No single `component`: five components share this page, each answering a different
    // plugin postMessage. Same shape as CommandList's stories, same declared absence.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Every asset an editor picks from the Media Library crosses a plugin iframe that Studio ' +
            'reaches only by `postMessage`, and five small components stand between the click and ' +
            'the file landing in a field. The audit finding here is that failure and success paint ' +
            'the same thing on screen: nothing.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/studio/assetSourceMediaLibrary/shared/{EnsureMediaLibrary,OpenInSourceDialog,SelectAssetsDialog,UploadAssetDialog,Iframe}.tsx` |',
          '| Tier | SERVICE. The same asset-service seam `Forms & Input/AssetSourceBrowser` sits in front of: once "Media Library" is picked, `MediaLibraryAssetSource` mounts these five underneath it |',
          '| Audit | \u{1f534} needs-work (`error-recovery`, `change-visibility`). A plugin iframe with no load or error state, a dialog that never paints a pixel, and a validation banner reachable only if a schema author opts in |',
          '| Patterns | `error-recovery` \u00b7 `change-visibility` |',
          '| Findings | 8 |',
          '',
          'All five load or wrap a single Media Library plugin iframe, a separate web app ' +
            '(`media.sanity.io` in production) reached only through `postMessage`. `EnsureMediaLibrary` ' +
            'is the gate before any of them mount, resolving a library id from a project or accepting ' +
            'one directly. `Iframe` is the shared frame underneath. `SelectAssetsDialog` and ' +
            '`OpenInSourceDialog` wrap it in a Studio `Dialog` for picking or viewing an asset; ' +
            '`UploadAssetsDialog` does not, which is the fourth finding below.',
          '',
          '**What reading it turned up.**',
          '',
          '<details><summary><b>`EnsureMediaLibrary`\u2019s "no library" card never says how to get one.</b></summary>',
          '',
          'The `inactive` branch (:26-39) renders a caution `Card` with one line of text, ' +
            '`error.no-media-library-provisioned`, and nothing else: no link, no button, no next ' +
            'step. An author who has never provisioned a Media Library sees exactly the same amount ' +
            'of guidance as one who has.',
          '',
          '</details>',
          '',
          '<details><summary><b>Two structurally different states render byte-identical: nothing.</b></summary>',
          '',
          '`loading` and `active` both fall through every `if` (:26, :41) to the bare `return null` ' +
            '(:60); the `useEffect` for `active` fires `onSetMediaLibraryIds`, but the component ' +
            'itself paints nothing either way. The only visible feedback this gate ever gives an ' +
            'author is failure.',
          '',
          '</details>',
          '',
          '<details><summary><b>The shared `Iframe` has no load or error handling at all.</b></summary>',
          '',
          'Grepped the whole file: no `onLoad`, no `onError`, no timeout. It is a `<Card>` around a ' +
            'bare `<iframe>` (Iframe.tsx:26-42). A slow Media Library, a blocked third-party frame, ' +
            'or a 500 from the plugin app all look identical to "still opening"; there is no code ' +
            'path in this component that could ever tell them apart.',
          '',
          '</details>',
          '',
          '<details><summary><b>`UploadAssetsDialog` never renders a dialog.</b></summary>',
          '',
          'Its own return (UploadAssetDialog.tsx:183) is `<Iframe ref={setIframe} src={iframeUrl} ' +
            'hidden />`: `hidden` is a static prop, not a condition. Open or not, this component ' +
            "paints nothing. `AssetSource.uploadMode`'s own doc comment (`@sanity/types`) confirms " +
            "the split by design: `'picker'` mode means \"the studio opens a native file picker... " +
            'progress is tracked via the uploader and shown in the studio UI," meaning by the ' +
            'CALLER, not this file. What this component actually does is *write into* the `uploader` ' +
            'object it is handed (`uploader.updateFile(...)`) in response to plugin `postMessage`s; ' +
            'nothing it renders is what an editor sees.',
          '',
          '</details>',
          '',
          '<details><summary><b>The validation banner is opt-in, and nothing in the core schema opts in.</b></summary>',
          '',
          '`SelectAssetsDialog` only surfaces markers `filterMediaValidationMarkers` ' +
            "(`shared/validation.ts`) keeps: those tagged `__internal_metadata.name === 'media'`. " +
            "That tag is written by exactly one validator (`objectValidator.ts`'s `media` keyword), " +
            "which only runs if a schema field's own validation chains `Rule.media(fn)`. The " +
            'built-in `image`/`file` types (`@sanity/schema/src/legacy/types/{image,file}.ts`) ' +
            'declare their hidden `media` field with no such rule. On a stock schema, ' +
            '`validateSelection` (:86-114) still runs on every selection change, but `validation` ' +
            'is always `[]`; the banner exists only for schemas that explicitly reach for ' +
            '`Rule.media`.',
          '',
          '</details>',
          '',
          '<details><summary><b>When a `Rule.media` validator does throw, nothing catches it.</b></summary>',
          '',
          'The `media` validator (`objectValidator.ts:81-173`) does a live ' +
            '`getClient().withConfig(...).fetch(...)` GROQ read before it ever calls the schema ' +
            "author's own function; a network failure there is wrapped and re-thrown, not " +
            'swallowed. `SelectAssetsDialog.handleAssetSelection` (:163-176) awaits ' +
            '`validateSelection` with no try/catch, and its only caller is ' +
            '`void handleAssetSelection(...)` inside `handlePluginMessage` (:178-186): an unhandled ' +
            'rejection with no user-visible trace. The Select button just never updates.',
          '',
          '</details>',
          '',
          '<details><summary><b>None of the three dialogs say which library or project an asset is coming from.</b></summary>',
          '',
          '`dialogHeaderTitle` is caller-supplied and, in the one real caller ' +
            '(`MediaLibraryAssetSource.tsx:73-79`), names the FIELD being populated ("Select image ' +
            'for {targetTitle}"), never the source library or org. Someone with more than one Media ' +
            'Library configured has nothing in this component tree telling them which one they are ' +
            'browsing.',
          '',
          '</details>',
          '',
          '<details><summary><b>`OpenInSourceDialog` has no `open` prop.</b></summary>',
          '',
          'Unlike its two siblings, it takes no boolean at all; the real caller ' +
            '(`MediaLibraryAssetSource.tsx:88-105`) mounts and unmounts it entirely via ' +
            '`action === \'openInSource\' && assetToOpen && (...)`. "Closing" it in isolation means ' +
            'unmounting the component, not passing `open={false}`; the `Default` story below ' +
            'reproduces that with local mount state rather than a prop.',
          '',
          '</details>',
          '',
          '**On the portal landmine.** A sibling pass through this storybook found that components ' +
            "taking a `portalElementName: string` prop resolve their portal through @sanity/ui's " +
            'NAMED elements map, and render nothing inside a plain `OverlayFrame`. None of these ' +
            'three dialogs take that prop: `OpenInSourceDialog` and `SelectAssetsDialog` both use ' +
            'the shared `AppDialog` (`shared/Dialog.tsx`, a bare `styled(Dialog)` with no `portal` ' +
            'prop set), which resolves through the UNNAMED portal slot, exactly what `OverlayFrame` ' +
            'provides (and what the real `MediaLibraryAssetSource.tsx:70` does too, via a plain ' +
            '`<PortalProvider element={...}>`). `OverlayFrame` is the correct harness here; ' +
            '`NamedPortalFrame` is not needed.',
          '',
          '> **Why it matters:** every failure mode in this chain, a library that never provisions, ' +
            'a plugin iframe that never loads, a validation check that silently throws, looks the ' +
            'same to an editor: nothing changes on screen. The one thing this component family is ' +
            'reliably good at signaling is success.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:error-recovery',
    'pattern:change-visibility',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/* ══════════════════════════════════════════════════════════════════════
   EnsureMediaLibrary - 3 returns: inactive card (:26-39), error card (:41-58), null (:60).
   Rendered directly with an explicit `mediaLibraryInfo` prop rather than through
   `MediaLibraryProvider`, so each story can pin its own project/library id straight to a
   mocked backend response. */

const inactiveClient = createMockSanityClient({
  requests: {
    '/projects/proj-inactive': {organizationId: 'org-inactive'},
    // An empty library list: `getMediaLibrariesForOrganization` emits nothing, so
    // `defaultIfEmpty` resolves the whole pipe to `{status: 'inactive'}` (useEnsureMediaLibrary.ts:130-132).
    '/media-libraries?organizationId=org-inactive': {data: []},
  },
})

const provisionErrorClient = createMockSanityClient({
  // No `organizationId` on the response: `getOrganizationIdFromProjectId` throws
  // `ProvisionError(..., 'ERROR_NO_ORGANIZATION_FOUND')` (useEnsureMediaLibrary.ts:95-105).
  requests: {'/projects/proj-error': {}},
})

const neverResolvingClient = createMockSanityClient()
Object.assign(neverResolvingClient.observable, {request: () => NEVER})

export const EnsureMediaLibraryInactive: Story = {
  name: 'EnsureMediaLibrary: no library provisioned',
  decorators: [withClient(inactiveClient)],
  render: () => (
    <EnsureMediaLibrary
      mediaLibraryInfo={{from: 'project', projectId: 'proj-inactive'}}
      onSetMediaLibraryIds={() => undefined}
    />
  ),
}

export const EnsureMediaLibraryError: Story = {
  name: 'EnsureMediaLibrary: provisioning error',
  decorators: [withClient(provisionErrorClient)],
  render: () => (
    <EnsureMediaLibrary
      mediaLibraryInfo={{from: 'project', projectId: 'proj-error'}}
      onSetMediaLibraryIds={() => undefined}
    />
  ),
}

/** A request that never resolves, holding the hook at its initial `status: 'loading'` forever -
 * deterministic proof of finding 2. The dashed box is the story frame; the component itself
 * renders nothing, and would render exactly this same nothing once the library resolved. */
export const EnsureMediaLibraryLoading: Story = {
  name: 'EnsureMediaLibrary: loading (identical to resolved/active)',
  decorators: [withClient(neverResolvingClient)],
  render: () => (
    <div style={EMPTY_FRAME_STYLE}>
      <EnsureMediaLibrary
        mediaLibraryInfo={{from: 'project', projectId: 'proj-loading'}}
        onSetMediaLibraryIds={() => undefined}
      />
    </div>
  ),
}

/* ══════════════════════════════════════════════════════════════════════
   Iframe - the shared frame. Two props, no hooks, no load/error state (finding 3). Pointed at
   an RFC 2606 `.invalid` host: guaranteed never to resolve, so what's on screen is honestly
   "nothing happened" rather than a fabricated success. */

function IframeCard({hidden}: {hidden?: boolean}) {
  return (
    <Card
      border
      radius={2}
      style={{width: 420, height: 240, overflow: 'hidden'}}
      data-testid="iframe-demo-card"
    >
      <Iframe src="https://media-library-plugin.invalid/select" hidden={hidden} />
    </Card>
  )
}

export const IframeVisible: Story = {
  name: 'Iframe: visible',
  render: () => <IframeCard />,
}

/** `hidden` sets `display:none` (Iframe.tsx:17-19) - the dashed box is the story frame; the
 * component itself paints nothing. This is the exact prop `UploadAssetsDialog` always passes
 * (finding 4). */
export const IframeHidden: Story = {
  name: 'Iframe: hidden (renders nothing)',
  render: () => (
    <div style={EMPTY_FRAME_STYLE}>
      <IframeCard hidden />
    </div>
  ),
}

/* ══════════════════════════════════════════════════════════════════════
   OpenInSourceDialog - 2 returns: null when `asset.source?.id` is missing (:74-80), otherwise
   the full dialog (:82-140). No `open` prop (finding 8) - closing means unmounting. */

const openableAsset = {
  _id: 'image-asset-1',
  _type: 'sanity.imageAsset',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
  url: 'https://cdn.sanity.io/images/mock-project-id/mock-data-set/image-asset-1.jpg',
  path: 'images/mock-project-id/mock-data-set/image-asset-1.jpg',
  assetId: 'image-asset-1',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  size: 245_760,
  uploadId: 'upload-1',
  // 'sanity-media-library' is `sourceName` (createAssetSource.tsx:17) - hardcoded here rather
  // than imported, since only the literal value matters to `openInSource`'s own name check.
  source: {id: 'source-asset-1', name: 'sanity-media-library'},
} as unknown as Asset

const assetWithoutSourceId = {...openableAsset, source: undefined} as unknown as Asset

function OpenInSourceHarness({asset}: {asset: Asset}) {
  const [open, setOpen] = useState(true)
  if (!open) return <Reopen onClick={() => setOpen(true)} />
  return (
    <OverlayFrame minHeight={420}>
      <OpenInSourceDialog
        asset={asset}
        dialogHeaderTitle="View in Media Library"
        selectNewAssetButtonLabel="Select a different asset"
        onClose={() => setOpen(false)}
        onSelectNewAsset={() => undefined}
      />
    </OverlayFrame>
  )
}

export const OpenInSourceDefault: Story = {
  name: 'OpenInSourceDialog: default',
  decorators: [defaultDecorator],
  render: () => (
    <WithMediaLibraryIds>
      <OpenInSourceHarness asset={openableAsset} />
    </WithMediaLibraryIds>
  ),
}

/** `asset.source?.id` missing: the component `console.warn`s and returns `null` (:74-80) rather
 * than rendering an empty dialog shell. */
export const OpenInSourceMissingSourceAssetId: Story = {
  name: 'OpenInSourceDialog: missing source asset id (renders nothing)',
  decorators: [defaultDecorator],
  render: () => (
    <div style={EMPTY_FRAME_STYLE}>
      <WithMediaLibraryIds>
        <OpenInSourceHarness asset={assetWithoutSourceId} />
      </WithMediaLibraryIds>
    </div>
  ),
}

/* ══════════════════════════════════════════════════════════════════════
   SelectAssetsDialog - `!open` → null (:189-191); otherwise the dialog, Select disabled while
   `assetSelection` is empty or validation has an error (:227-230). */

function SelectAssetsHarness(props: {
  fieldName: string
  selectAssetType: 'image' | 'file'
  selection?: AssetSelectionItem[]
}) {
  const schemaType = useDemoFieldType(props.fieldName)
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(true)
  if (!open) return <Reopen onClick={() => setOpen(true)} />
  return (
    <OverlayFrame minHeight={480}>
      <FormValueProvider value={DEMO_DOCUMENT_VALUE}>
        <SelectAssetsDialog
          dialogHeaderTitle={`Select image for ${schemaType?.title ?? props.fieldName}`}
          open
          onClose={() => setOpen(false)}
          onSelect={() => undefined}
          ref={ref}
          schemaType={schemaType}
          selectAssetType={props.selectAssetType}
          selection={props.selection ?? []}
        />
      </FormValueProvider>
    </OverlayFrame>
  )
}

function ClosedSelectAssetsDialog() {
  const schemaType = useDemoFieldType('heroImage')
  const ref = useRef<HTMLDivElement>(null)
  return (
    <FormValueProvider value={DEMO_DOCUMENT_VALUE}>
      <SelectAssetsDialog
        open={false}
        onClose={() => undefined}
        onSelect={() => undefined}
        ref={ref}
        schemaType={schemaType}
        selectAssetType="image"
        selection={[]}
      />
    </FormValueProvider>
  )
}

export const SelectAssetsClosed: Story = {
  name: 'SelectAssetsDialog: closed (renders nothing)',
  decorators: [defaultDecorator],
  render: () => (
    <div style={EMPTY_FRAME_STYLE}>
      <WithMediaLibraryIds>
        <ClosedSelectAssetsDialog />
      </WithMediaLibraryIds>
    </div>
  ),
}

export const SelectAssetsOpenEmpty: Story = {
  name: 'SelectAssetsDialog: open, no selection yet (Select disabled)',
  decorators: [defaultDecorator],
  render: () => (
    <WithMediaLibraryIds>
      <SelectAssetsHarness fieldName="heroImage" selectAssetType="image" />
    </WithMediaLibraryIds>
  ),
}

/** `selection` seeds `assetSelection`'s initial state directly (SelectAssetsDialog.tsx:75) - the
 * same state a real `assetSelection` plugin message would set, just supplied up front rather
 * than via a live postMessage. Select is enabled; no validation ran (finding 5: the plain
 * `heroImage` field carries no `Rule.media`, so there is nothing to fail). */
export const SelectAssetsOpenWithSelection: Story = {
  name: 'SelectAssetsDialog: open, selection already made (Select enabled)',
  decorators: [defaultDecorator],
  render: () => (
    <WithMediaLibraryIds>
      <SelectAssetsHarness
        fieldName="heroImage"
        selectAssetType="image"
        selection={[
          {
            asset: {_id: 'asset-1', _type: 'sanity.imageAsset', assetType: 'image'},
            assetInstanceId: 'instance-1',
          },
        ]}
      />
    </WithMediaLibraryIds>
  ),
}

/** The `heroImageValidated` field's `Rule.media(...)` (see the fixture schema above) is the one
 * path that makes the validation banner reachable at all (finding 5). The `media` validator does
 * a live GROQ read before calling that rule (`objectValidator.ts:110-118`); the mock client here
 * is patched with a bare `.fetch` so that read resolves instead of throwing unhandled
 * (finding 6). The `play` step dispatches a real `assetSelection` postMessage at the mounted
 * iframe's own `contentWindow` - the same event `usePluginPostMessage`'s listener filters on -
 * rather than reaching into component state, so this runs the actual selection→validate pipeline.
 *
 * The iframe itself never needs to load anything for that: `contentWindow` exists on an `iframe`
 * element the instant it mounts, independent of whether its `src` ever resolves, and the dialog's
 * `usePluginPostMessage` listener matches on `event.source`, not on frame content. This story used
 * to leave the iframe pointed at the real, live `useSanityMediaLibraryConfig()` host - a genuine
 * `media.sanity.io`-shaped URL - so the browser attempted a real cross-origin load and logged a
 * CSP frame-ancestors violation on every run, for a request whose result this story never reads.
 * `mediaLibrary.__internal.frontendHost` (`config/types.ts:1266-1274`, "Used for internal testing
 * against local or custom environments") overrides that host; pointed at the same reserved
 * `.invalid` domain `IframeCard` above already uses, for the same reason.
 *
 * SECOND, independent bug found live, past the CSP noise: the play function's own
 * `findByText('This asset needs approval...')` timed out even with the iframe issue fixed, on the
 * unfixed build, verified by dispatching the exact selection message live and confirming the
 * text stayed absent. `SelectAssetsDialog.tsx`'s validation status renders through
 * `FormFieldValidationStatus`, which wraps the message in a `Tooltip`
 * (FormFieldValidationStatus.tsx:47-64) - the text does not exist in the DOM until something
 * hovers the status icon, only the icon (`data-testid="input-validation-icon-error"`,
 * `ValidationStatusIcon.tsx:16`) is present
 * beforehand. Confirmed live: dispatching `mouseenter`/`mouseover` at that icon made the tooltip
 * text appear immediately. The play function now hovers the icon before asserting on its content.
 */
const mediaValidationClient = createMockSanityClient()
Object.assign(mediaValidationClient, {
  fetch: async () => ({_id: 'media-asset-under-review'}),
})

const withMediaValidationClient = WithStudioProviders({
  client: mediaValidationClient as unknown as SanityClient,
  config: {
    schema: {name: 'storybook', types: schemaTypes},
    mediaLibrary: {
      enabled: true,
      __internal: {frontendHost: 'https://media-library-plugin.invalid'},
    },
  },
})

const SELECT_ASSETS_TEST_ID = 'media-library-plugin-dialog-select-assets'

export const SelectAssetsValidationBlocksSelection: Story = {
  name: 'SelectAssetsDialog: selection made, but validation blocks it',
  decorators: [withMediaValidationClient],
  render: () => (
    <WithMediaLibraryIds>
      <SelectAssetsHarness fieldName="heroImageValidated" selectAssetType="image" />
    </WithMediaLibraryIds>
  ),
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    const dialog = await canvas.findByTestId(SELECT_ASSETS_TEST_ID)
    const iframe = dialog.querySelector('iframe')
    if (!iframe) throw new Error('Expected an iframe inside the Select Assets dialog')
    const selectionMessage: PluginPostMessage = {
      type: 'assetSelection',
      selection: [
        {
          asset: {_id: 'asset-under-review', _type: 'sanity.imageAsset', assetType: 'image'},
          assetInstanceId: 'instance-under-review',
        },
      ],
    }
    window.dispatchEvent(
      new MessageEvent('message', {data: selectionMessage, source: iframe.contentWindow}),
    )
    // The message above only sets `validation` state; the icon it produces is present right
    // away, but its message text is inside a Tooltip that does not mount until hovered.
    const errorIcon = await canvas.findByTestId('input-validation-icon-error', {}, {timeout: 3000})
    errorIcon.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}))
    errorIcon.dispatchEvent(new MouseEvent('mouseover', {bubbles: true}))
    await canvas.findByText('This asset needs approval before use.', {}, {timeout: 3000})
  },
}

/* ══════════════════════════════════════════════════════════════════════
   UploadAssetsDialog - `!open` → null (:179-181); otherwise a permanently `hidden` Iframe
   (:183, finding 4). The visible progress an editor sees lives entirely outside this component,
   in whatever reads the `uploader` object it writes to - reproduced below with an external
   readout driven by the same object. */

function ClosedUploadAssetsDialog() {
  return <UploadAssetsDialog open={false} onClose={() => undefined} onSelect={() => undefined} />
}

export const UploadAssetsNotOpen: Story = {
  name: 'UploadAssetsDialog: not open (renders nothing)',
  decorators: [defaultDecorator],
  render: () => (
    <div style={EMPTY_FRAME_STYLE}>
      <WithMediaLibraryIds>
        <ClosedUploadAssetsDialog />
      </WithMediaLibraryIds>
    </div>
  ),
}

function OpenButInvisibleUploadAssetsDialog() {
  const schemaType = useDemoFieldType('attachment')
  return (
    <UploadAssetsDialog
      open
      onClose={() => undefined}
      onSelect={() => undefined}
      schemaType={schemaType}
    />
  )
}

/** `open` is `true` here - the difference from the story above is only whether this component is
 * mounted, not whether anything becomes visible. Same empty dashed box either way. */
export const UploadAssetsOpenIsInvisible: Story = {
  name: 'UploadAssetsDialog: open, but still renders nothing',
  decorators: [defaultDecorator],
  render: () => (
    <div style={EMPTY_FRAME_STYLE}>
      <WithMediaLibraryIds>
        <OpenButInvisibleUploadAssetsDialog />
      </WithMediaLibraryIds>
    </div>
  ),
}

/** Proves finding 4 concretely: a visible progress readout built entirely OUTSIDE
 * `UploadAssetsDialog`, reading the same `uploader` object handed to it, updated only because
 * this component calls `uploader.updateFile(...)` in response to plugin messages
 * (UploadAssetDialog.tsx:104-109). The `play` step dispatches real `uploadProgress` and
 * `uploadResponse` postMessages at the mounted (hidden) iframe's `contentWindow`; completion
 * runs the real `useLinkAssets` → `client.observable.request(...)` link call (a deliberate ~1s
 * delay is baked into that pipeline, `useLinkAssets.tsx:111`), which is why the client below is
 * patched with a wildcard `'*'` response - the real call sends `url`, not `uri`, a mismatch
 * `VideoPreview.stories.tsx` documents against the same mock client. */
const uploadLinkClient = createMockSanityClient({
  requests: {'*': {document: {_id: 'linked-file-1'}}},
})

function UploadRelayHarness() {
  const schemaType = useDemoFieldType('attachment')
  const [files, setFiles] = useState<AssetSourceUploadFile[]>([
    {
      id: 'file-1',
      file: new File(['contents'], 'press-photo.jpg', {type: 'image/jpeg'}),
      progress: 0,
      status: 'uploading',
    },
  ])
  const [closedNote, setClosedNote] = useState<string | null>(null)
  const filesRef = useRef(files)
  useEffect(() => {
    filesRef.current = files
  }, [files])

  const uploader = useMemo<AssetSourceUploader>(
    () => ({
      upload: () => [],
      abort: () => undefined,
      getFiles: () => filesRef.current,
      updateFile: (fileId, patch) => {
        // `AssetSourceUploader.updateFile`'s own type widens `status` to a plain `string` -
        // narrower than `AssetSourceUploadFile['status']` - so the merge needs a cast back.
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? ({...f, ...patch} as AssetSourceUploadFile) : f)),
        )
      },
      subscribe: () => () => undefined,
      reset: () => setFiles([]),
    }),
    [],
  )

  return (
    <Stack gap={4}>
      <Card padding={3} radius={2} border data-testid="upload-relay-readout">
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            What the editor actually sees (built by the caller, not by UploadAssetsDialog)
          </Text>
          {files.map((f) => (
            <Flex key={f.id} justify="space-between" gap={3}>
              <Text size={1}>{f.file.name}</Text>
              <Text size={1} muted>{`${f.status} · ${f.progress}%`}</Text>
            </Flex>
          ))}
          {closedNote && <Text size={1}>{closedNote}</Text>}
        </Stack>
      </Card>
      <UploadAssetsDialog
        open
        onClose={() => setClosedNote('Dialog closed after linking.')}
        onSelect={() => undefined}
        schemaType={schemaType}
        uploader={uploader}
      />
    </Stack>
  )
}

/**
 * This used to throw on every run: `canvasElement.querySelector('iframe')` ran synchronously,
 * with no wait, but `WithStudioProviders` (`lib/testProvider.tsx:534-540`) wraps the whole tree in
 * `<Suspense fallback={null}>` around the async `createWorkspaceFromConfig(...)` call - on first
 * paint `canvasElement` is genuinely empty, and only once that promise resolves does
 * `UploadRelayHarness`, `UploadAssetsDialog` and its `Iframe` actually mount. The play function
 * was racing that resolution and losing. `waitFor` polls until the iframe exists (or times out
 * with a real assertion failure) instead of asserting on whatever happened to be there yet.
 */
export const UploadAssetsProgressRelayedToCaller: Story = {
  name: 'UploadAssetsDialog: progress and completion, relayed to the caller',
  decorators: [withClient(uploadLinkClient)],
  render: () => (
    <WithMediaLibraryIds>
      <UploadRelayHarness />
    </WithMediaLibraryIds>
  ),
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    const iframe = await waitFor(() => {
      const el = canvasElement.querySelector('iframe')
      if (!el) throw new Error('Expected the upload relay iframe to be in the DOM')
      return el
    })

    const progress: PluginPostMessage = {
      type: 'uploadProgress',
      files: [{id: 'file-1', status: 'uploading', progress: 65}],
    }
    window.dispatchEvent(
      new MessageEvent('message', {data: progress, source: iframe.contentWindow}),
    )
    await canvas.findByText('uploading · 65%')

    const response: PluginPostMessage = {
      type: 'uploadResponse',
      assets: [
        {
          asset: {_id: 'file-under-review', _type: 'sanity.fileAsset', assetType: 'file'},
          assetInstanceId: 'instance-2',
        },
      ],
    }
    window.dispatchEvent(
      new MessageEvent('message', {data: response, source: iframe.contentWindow}),
    )
    await canvas.findByText('Dialog closed after linking.', {}, {timeout: 3000})
  },
}
