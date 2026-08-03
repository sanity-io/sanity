import {type UploadState} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type CSSProperties, useId, useRef, useState} from 'react'
import {userEvent, within} from 'storybook/test'

// Real components from real paths (org contract §8): these are the pieces the whole-field
// pages (`ImageInput.stories.tsx`, `FileInput.stories.tsx`) assemble, taken apart.
import {ActionsMenu} from '../../../../packages/sanity/src/core/form/inputs/files/common/ActionsMenu'
import {FileActionsMenu} from '../../../../packages/sanity/src/core/form/inputs/files/FileInput/FileActionsMenu'
import {FileSkeleton} from '../../../../packages/sanity/src/core/form/inputs/files/FileInput/FileSkeleton'
import {InvalidFileWarning} from '../../../../packages/sanity/src/core/form/inputs/files/FileInput/InvalidFileWarning'
import {ImageAccessPolicy} from '../../../../packages/sanity/src/core/form/inputs/files/ImageInput/ImageAccessPolicy'
import {
  ImageActionsMenu,
  ImageActionsMenuWaitPlaceholder,
} from '../../../../packages/sanity/src/core/form/inputs/files/ImageInput/ImageActionsMenu'
import {ImagePreview} from '../../../../packages/sanity/src/core/form/inputs/files/ImageInput/ImagePreview'
import {InvalidImageWarning} from '../../../../packages/sanity/src/core/form/inputs/files/ImageInput/InvalidImageWarning'
import {type AssetAccessPolicy} from '../../../../packages/sanity/src/core/form/inputs/files/types'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {
  boundFileValue,
  boundImageValue,
  DEMO_IMAGE_HEIGHT,
  DEMO_IMAGE_WIDTH,
  demoImageDataUri,
  fileAssetFixtures,
  imageAssetFixtures,
  WithAssetLimitUpsell,
} from '../../lib/mockAssetFixtures'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'
import {OverlayFrame} from '../overlays/OverlayFrame'

/**
 * One schema per state this page needs the real `FormBuilder` for:
 * - `fileFieldDoc` / `imageFieldDoc` - a plain field of each type, hotspot enabled on the image
 *   so the crop button in `ImageActionsMenu` has something to open.
 * - `fileWithDescriptionDoc` - the file type extended with a plain `description` field, so
 *   `BaseFileInput`'s member dispatch (FileInput.tsx:190-241) has a second member to dispatch.
 */
const schemaTypes = [
  {
    name: 'fileFieldDoc',
    title: 'Document with a file',
    type: 'document',
    fields: [{name: 'file', title: 'Attachment', type: 'file'}],
  },
  {
    name: 'fileWithDescriptionDoc',
    title: 'Document with a described file',
    type: 'document',
    fields: [
      {
        name: 'attachment',
        title: 'Attachment',
        type: 'file',
        fields: [{name: 'description', title: 'Description', type: 'string'}],
      },
    ],
  },
  {
    name: 'imageFieldDoc',
    title: 'Document with an image',
    type: 'document',
    fields: [{name: 'image', title: 'Cover image', type: 'image', options: {hotspot: true}}],
  },
]

const previewStore = createMockDocumentPreviewStore({
  documents: [...fileAssetFixtures, ...imageAssetFixtures],
})

/**
 * A well-formed reference (passes `isFileSource` / `isImageSource`, same id shape as
 * `BOUND_FILE_REF` / `BOUND_IMAGE_REF`) to a document the preview store does not carry. This is
 * the same "missing reference" convention `Forms & Input/AssetPreview` established for the
 * search-filter asset preview: `observePaths` resolves an unresolvable id to `null`
 * synchronously (`mockDocumentPreviewStore.ts:147`) rather than hanging, so it is a faithful
 * simulation of "the reference exists, the target does not," not a story-only trick.
 */
const MISSING_FILE_REF = 'file-0000000000000000000000000000000000000000-pdf'
const missingFileValue = {_type: 'file', asset: {_type: 'reference', _ref: MISSING_FILE_REF}}

const MISSING_IMAGE_REF = 'image-0000000000000000000000000000000000000000-800x600-jpg'
const missingImageValue = {_type: 'image', asset: {_type: 'reference', _ref: MISSING_IMAGE_REF}}

/**
 * `UploadProgress` marks an upload stale once its `updatedAt` is older than `STALE_UPLOAD_MS`
 * (2 minutes: `common/constants.ts:6`), checked once on mount (`common/UploadProgress.tsx:21-25`).
 * Backdating the fixture's timestamp reaches that real check honestly, no fake timers required.
 */
const STALE_TIMESTAMP = new Date(Date.now() - 5 * 60 * 1000).toISOString()

const staleFileValue = {
  _type: 'file',
  _upload: {
    progress: 30,
    createdAt: STALE_TIMESTAMP,
    updatedAt: STALE_TIMESTAMP,
    file: {name: 'annual-report-2026.pdf', type: 'application/pdf'},
  } satisfies UploadState,
}
const staleImageValue = {
  _type: 'image',
  _upload: {
    progress: 55,
    createdAt: STALE_TIMESTAMP,
    updatedAt: STALE_TIMESTAMP,
    file: {name: 'coastline.jpg', type: 'image/jpeg'},
  } satisfies UploadState,
}

/** Mounts a document through the real `FormBuilder`, wrapped for the asset-limit context both
 * `BaseFileInput` and `BaseImageInput` call unconditionally (see `mockAssetFixtures.tsx`). */
function FieldDemo(props: {documentType: string; initialDocument?: Record<string, unknown>}) {
  const id = `fb-internals-${useId().replace(/:/g, '')}`
  return (
    <WithAssetLimitUpsell>
      <div style={{maxWidth: 640}}>
        <FormBuilderHarness
          documentType={props.documentType}
          initialDocument={props.initialDocument}
          id={id}
          height="auto"
        />
      </div>
    </WithAssetLimitUpsell>
  )
}

/** The same menu content behind both trigger chromes below; only the identity around it
 * differs, which is the argument the `AssetActionsMenus` story makes. */
function DemoMenuItems() {
  return (
    <ActionsMenu
      browse={null}
      upload={null}
      onReset={() => undefined}
      downloadUrl="https://cdn.sanity.io/files/mock-project-id/mock-data-set/demo.pdf?dl"
      copyUrl="https://cdn.sanity.io/files/mock-project-id/mock-data-set/demo.pdf"
      readOnly={false}
    />
  )
}

function OpenFileActionsMenu() {
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  return (
    <FileActionsMenu
      accessPolicy="private"
      size={2_411_233}
      originalFilename="annual-report-2026.pdf"
      isMenuOpen={isMenuOpen}
      onMenuOpen={setIsMenuOpen}
      menuButtonRef={menuButtonRef}
    >
      <DemoMenuItems />
    </FileActionsMenu>
  )
}

function OpenImageActionsMenu(props: {showEdit: boolean}) {
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  return (
    <div style={{position: 'relative', width: 220, height: 56}}>
      <ImageActionsMenu
        onEdit={() => undefined}
        setHotspotButtonElement={() => undefined}
        menuButtonRef={menuButtonRef}
        showEdit={props.showEdit}
        isMenuOpen={isMenuOpen}
        onMenuOpen={setIsMenuOpen}
      >
        <DemoMenuItems />
      </ImageActionsMenu>
    </div>
  )
}

/** `ImageAccessPolicy` (ImageAccessPolicy.tsx:16-23) only draws for one of its four declared
 * inputs. The other three are visually the same box: empty. */
function AccessPolicySample(props: {policy: AssetAccessPolicy}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {props.policy}
      </Text>
      <Card border radius={2} padding={4} style={{position: 'relative', minHeight: 56, width: 160}}>
        <ImageAccessPolicy accessPolicy={props.policy} />
      </Card>
    </Stack>
  )
}

/** The real composition from `ImageInputAsset.tsx:82-113`: preview, access badge and menu
 * stacked in one `position: relative` box, each absolutely positioned against it. `ImagePreview`
 * gets a resolvable `src` here (the `ImageTool` demo data URI) so, unlike the whole-field
 * `ImageInput` page, the pixels actually load instead of holding on the loading overlay. */
function ComposedImageStage() {
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const customProperties = {
    'position': 'relative',
    'width': 320,
    '--image-width': DEMO_IMAGE_WIDTH,
    '--image-height': DEMO_IMAGE_HEIGHT,
  } as CSSProperties
  return (
    <div style={customProperties}>
      <ImagePreview alt="Preview of the hotspot demo cover image" src={demoImageDataUri} />
      <ImageAccessPolicy accessPolicy="private" />
      <ImageActionsMenu
        onEdit={() => undefined}
        setHotspotButtonElement={() => undefined}
        menuButtonRef={menuButtonRef}
        showEdit
        isMenuOpen={isMenuOpen}
        onMenuOpen={setIsMenuOpen}
      >
        <DemoMenuItems />
      </ImageActionsMenu>
    </div>
  )
}

const meta: Meta = {
  title: 'Forms & Input/Image and File Internals',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'An author looking at a spinner in these fields cannot tell whether it is still ' +
            'loading or silently broken forever, and cannot tell a private asset from one whose ' +
            'access status was never checked; both read as the same blank.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/files/common/`, `.../files/FileInput/`, `.../files/ImageInput/` (`ActionsMenu`, `FileActionsMenu`, `FileSkeleton`, `InvalidFileWarning`, `ImageAccessPolicy`, `ImageActionsMenu`, `ImagePreview`, `InvalidImageWarning`) |',
          '| Tier | SERVICE, with one CORE-adjacent exception. Everything here is the asset-service chrome shared by both fields (menus, access badges, skeletons, warnings); the exception is `ImageInputHotspotInput`, which owns the proprietary hotspot/crop editor and is CORE-adjacent for the same reason Forms & Input/ImageInput is |',
          '| Audit | 🟡 needs-work (`asset-preview-loading`). Continues the loading-state audit Forms & Input/AssetPreview ran on the search-filter asset preview, this time on the field inputs themselves |',
          '| Patterns | `asset-preview-loading` |',
          '',
          'The pieces the whole-field pages (Forms & Input/FileInput, Forms & Input/ImageInput) ' +
            'assemble into a working input: the access badge, the actions menu, the wait ' +
            'placeholder, the invalid-reference warning, the stale-upload banner, and (image ' +
            'only) the hotspot dialog.',
          '',
          'File and image read as siblings from the whole-field pages: same drop target, same ' +
            'asset-service seam. Taken apart, they diverge in ways those pages have no room to ' +
            "show. `FileActionsMenu` bakes the file's identity, filename and size into the same " +
            'card that triggers its menu; `ImageActionsMenu` is a bare floating toolbar with no ' +
            'identity in it at all, the pixels carry the identity and the access badge is a ' +
            'third, independently positioned component. `ImageAccessPolicy` only draws for one of ' +
            'its four declared inputs (`private`); `public`, `unknown` and `checking` are the ' +
            'same empty box. And `ImagePreview`, handed a source that fails to load, only tells ' +
            'the author about it when `accessPolicy` happens to be `unknown`; the same failure ' +
            'under the default `public` policy leaves the loading spinner running forever.',
          '',
          'Mocking boundary: everything here mounts the real component. `FileActionsMenu`, ' +
            '`ImageActionsMenu`, `ImageAccessPolicy`, `ImagePreview`, `InvalidFileWarning` and ' +
            '`InvalidImageWarning` are driven directly with hand-supplied props, each one is a ' +
            'renderer of a fact something else already decided (an access policy, a menu-open ' +
            'flag, a broken src). The dispatch, dangling-reference, stale-upload and ' +
            'hotspot-dialog stories go through the real `FormBuilderHarness` instead, so the ' +
            'branch is reached the way the field reaches it, not asserted by hand.',
          '',
          '> **Why it matters:** an author looking at a spinner cannot tell whether it is still ' +
            'loading or silently broken forever, and cannot tell a private asset from one whose ' +
            'access status was never checked. Both read as the same blank.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      previewStore,
    }),
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:forms',
    'pattern:asset-preview-loading',
    'audit:needs-work',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * `ImageAccessPolicy` (ImageAccessPolicy.tsx:13-24) branches on exactly one value out of the
 * four declared by `AssetAccessPolicy` (`checking | private | public | unknown`, `types.ts:10`).
 * `private` draws the lock badge; the other three all return `null`. An author cannot tell
 * "this is public", "this is unknown" and "this hasn't finished checking" apart by looking at
 * this component, because none of them draw anything.
 */
export const AccessPolicyStates: Story = {
  name: 'ImageAccessPolicy: the four inputs, two outcomes',
  render: () => (
    <Flex gap={4} wrap="wrap">
      <AccessPolicySample policy="checking" />
      <AccessPolicySample policy="private" />
      <AccessPolicySample policy="public" />
      <AccessPolicySample policy="unknown" />
    </Flex>
  ),
}

/**
 * `FileActionsMenu` (FileInput/FileActionsMenu.tsx) and `ImageActionsMenu`
 * (ImageInput/ImageActionsMenu.tsx:26-69) both wrap the same shared `ActionsMenu` for their
 * menu content, only the trigger chrome around it differs. File wraps a full identity card
 * (icon, filename, size) that is itself the click target for the menu; image is a bare
 * `Inline` of icon buttons with no identity in it, positioned `absolute; top: 0; right: 0`
 * over the pixels (`MenuActionsWrapper.styled.ts`). Image also carries a second button
 * (`showEdit`, the crop icon) file has no equivalent for, since only image has a hotspot to
 * open. Both menus are opened here; the crop button's absence in the second image sample is
 * the real `showEdit={false}` branch, not a missing story.
 *
 * Each sample sits in its own `OverlayFrame` (stories/overlays/OverlayFrame.tsx), the
 * org-standard containment harness, for the reason `Forms & Input/ArrayFunctions` documents.
 * Both chromes reach the same `OptionsMenuPopover`, which is a `Popover` with `portal` and
 * `constrainSize` and no boundary of its own (OptionsMenuPopover.tsx:80-87). With no ambient
 * `PortalProvider` or `BoundaryElementProvider` the portal lands on `document.body`, outside
 * the `.docs-story` canvas, and `constrainSize` measures against whatever scroll container it
 * finds. Measured on the docs page before this change: all three popovers rendered at 0x0 at
 * page origin, with `max-height` clamped to 41.98px, 136.97px and 241.95px respectively, so
 * the docs surface showed three triggers and no menus at all under a docblock promising
 * "both menus are opened here". On the canvas surface they did render, at 117x125 each, but
 * the triggers are only 105px apart, so each menu covered the label below it.
 *
 * One frame per sample rather than one around all three: the frame is both the portal target
 * and the boundary element, so a frame per trigger gives each menu its own 125px of headroom
 * instead of three menus competing for one stacking context.
 */
export const AssetActionsMenus: Story = {
  name: 'FileActionsMenu vs ImageActionsMenu (same menu, different chrome)',
  render: () => (
    <Stack gap={5} style={{maxWidth: 640}}>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          FileActionsMenu: identity card is the menu trigger
        </Text>
        <OverlayFrame minHeight={280}>
          <OpenFileActionsMenu />
        </OverlayFrame>
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          ImageActionsMenu, showEdit: floating toolbar, no identity, crop button present
        </Text>
        <OverlayFrame minHeight={280}>
          <OpenImageActionsMenu showEdit />
        </OverlayFrame>
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          ImageActionsMenu, showEdit=false: same toolbar, crop button gone (no hotspot to open)
        </Text>
        <OverlayFrame minHeight={280}>
          <OpenImageActionsMenu showEdit={false} />
        </OverlayFrame>
      </Stack>
    </Stack>
  ),
}

/**
 * `FileSkeleton` (FileInput/FileSkeleton.tsx) and `ImageActionsMenuWaitPlaceholder`
 * (ImageInput/ImageActionsMenu.tsx:10-14) in isolation: what each field shows in place of the
 * thing it is still waiting on. File's skeleton mimics the whole file-card layout (icon plus
 * two text lines); image's placeholder is just a 25x25 skeleton square standing in for the
 * menu button alone. See `DanglingReference` below for what reaches each of these for real,
 * and for how differently the two fields couple this wait to their pixels.
 */
export const WaitPlaceholders: Story = {
  name: 'FileSkeleton vs ImageActionsMenuWaitPlaceholder, in isolation',
  render: () => (
    <Flex gap={5} align="flex-start">
      <Stack gap={2} style={{width: 280}}>
        <Text size={1} weight="semibold">
          FileSkeleton
        </Text>
        <Card border radius={2} padding={1}>
          <FileSkeleton />
        </Card>
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          ImageActionsMenuWaitPlaceholder
        </Text>
        <div style={{position: 'relative', width: 60, height: 40}}>
          <ImageActionsMenuWaitPlaceholder />
        </div>
      </Stack>
    </Flex>
  ),
}

/**
 * Both fields, given a well-formed reference to a document that does not exist
 * (`missingFileValue` / `missingImageValue` above), mounted through the real `FormBuilder`.
 *
 * File: `FilePreview` (FileInput/FilePreview.tsx:162-167) wraps its entire resolved content,
 * card, filename, menu, in `WithReferencedAsset` with `waitPlaceholder={<FileSkeleton />}`
 * (`utils/WithReferencedAsset.tsx:18`: `documentId && asset ? children(asset) : waitPlaceholder`).
 * A dangling reference means `asset` never resolves, so the whole card stays a skeleton
 * forever: no filename, no menu, nothing to click.
 *
 * Image: the pixels (`ImageInputPreview`, not gated on this observable at all) still attempt
 * to load, since they build their URL straight from the asset ref. Only the actions menu is
 * gated on the same referenced-document lookup (`ImageInputAssetMenu.tsx:263-265` returns
 * `ImageActionsMenuWaitPlaceholder` when `!documentId || !asset`), and it is a separate,
 * independently positioned component from the pixels. So a dangling image
 * reference leaves the crop/kebab button stuck on its skeleton while the preview area beside
 * it is doing something else entirely (loading its own, offline-unresolvable, cdn URL) rather
 * than the coordinated single skeleton the file field shows. Same failure, two different
 * shaped holes.
 */
export const DanglingReference: Story = {
  name: 'A reference to nothing, mounted for real',
  render: () => (
    <Flex gap={5} align="flex-start" wrap="wrap">
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          File: the whole card is the skeleton
        </Text>
        <FieldDemo documentType="fileFieldDoc" initialDocument={{file: missingFileValue}} />
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          Image: pixels attempt to load, only the menu is stuck
        </Text>
        <FieldDemo documentType="imageFieldDoc" initialDocument={{image: missingImageValue}} />
      </Stack>
    </Flex>
  ),
}

/**
 * `InvalidFileWarning` and `InvalidImageWarning` are the same component with the noun swapped.
 * Title, description and reset-button copy are byte-identical translations
 * (`i18n/bundles/studio.ts:860-865` vs `:952-957`): "The value of this field is not a valid
 * [file|image]. Resetting this field will let you choose a new [file|image]." Neither explains
 * WHY the reference is invalid (malformed shape vs a reference to something that was deleted
 * vs a document of the wrong type), and neither differs from the other beyond the one word.
 * Compare against `DanglingReference` above: a malformed reference gets this actionable
 * warning with a reset button; a well-formed reference to nothing gets a skeleton with no
 * warning and no way to reset it at all. The friendlier-looking failure is the one an author
 * cannot act on.
 */
export const InvalidReferenceWarnings: Story = {
  name: 'InvalidFileWarning vs InvalidImageWarning',
  render: () => (
    <Flex gap={4} wrap="wrap">
      <div style={{width: 320}}>
        <InvalidFileWarning onClearValue={() => undefined} />
      </div>
      <div style={{width: 320}}>
        <InvalidImageWarning onClearValue={() => undefined} />
      </div>
    </Flex>
  ),
}

/**
 * Neither `FileInput` nor `ImageInput`'s whole-field stories drive a stale upload. Both
 * `FileAsset.tsx:77-81` and `ImageInputAsset.tsx:84-88` render the same shape: an `isStale`
 * `UploadWarning` banner ABOVE the still-rendering `UploadProgress` bar, not instead of it, so an
 * interrupted upload shows a warning banner sitting on top of a progress bar that is still
 * animating as if nothing were wrong. Reached here for real: the fixture's `_upload.updatedAt`
 * is five minutes old, past the two-minute `STALE_UPLOAD_MS` threshold, so `UploadProgress`'s
 * own staleness check (`common/UploadProgress.tsx:21-25`) fires `onStale()` on mount.
 */
export const StaleUploadWarning: Story = {
  name: 'An interrupted upload, both fields',
  render: () => (
    <Flex gap={5} align="flex-start" wrap="wrap">
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          File
        </Text>
        <FieldDemo documentType="fileFieldDoc" initialDocument={{file: staleFileValue}} />
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          Image
        </Text>
        <FieldDemo documentType="imageFieldDoc" initialDocument={{image: staleImageValue}} />
      </Stack>
    </Flex>
  ),
}

/**
 * `BaseFileInput` (FileInput/FileInput.tsx:53-260) is a DISPATCHER: it maps every resolved
 * member to a renderer by `member.kind` and, for the `asset` member specifically, by name
 * (`renderInput={member.name === 'asset' ? renderAsset : renderInput}`, `:200`). Every
 * `FileInput` whole-field story uses a schema with only the system `asset` member, so that
 * branch never has a second member to route differently. Here the `file` type is extended with
 * a plain `description` field (`fileWithDescriptionDoc` above), so the same document exercises
 * both halves of the dispatch: `asset` goes to the special `FileAsset` UI with no field chrome
 * around it (`renderField={member.name === 'asset' ? passThrough : renderField}`, `:198`), while
 * `description` goes through the ordinary field renderer, chrome and all, like any string field
 * would. `member.kind === 'error' | 'decoration'` and the unknown-member-kind fallback (`:222-240`)
 * are real branches this fixture does not reach; reaching them needs a genuinely mismatched
 * document, which is exactly the territory `Forms & Input/ObjectInputMember` covers.
 */
export const FileFieldDispatch: Story = {
  name: 'BaseFileInput: dispatching asset vs an ordinary field',
  render: () => (
    <FieldDemo
      documentType="fileWithDescriptionDoc"
      initialDocument={{
        attachment: {
          ...boundFileValue,
          description: 'Q3 investor deck, redacted for external distribution.',
        },
      }}
    />
  ),
}

/**
 * `ImagePreview` (ImageInput/ImagePreview.tsx) computes two booleans from `isLoaded` /
 * `hasError`, both starting false: `showAccessWarning = hasError && accessPolicy === 'unknown'`
 * and `showLoading = !isLoaded && !showAccessWarning` (`:39-40`). Three real, reachable renders:
 *
 * - A resolvable `src` (the `ImageTool` demo data URI): the `<img>` fires `onLoad`, `isLoaded`
 *   becomes true, neither overlay shows.
 * - A `src` that fails to load with `accessPolicy="unknown"`: `onError` fires, `hasError` is
 *   true, `showAccessWarning` is true, the author sees "Could not load image. This may be due
 *   to access restrictions."
 * - The SAME failing `src`, but `accessPolicy` left at its default (`"public"`,
 *   `ImagePreview.tsx:17`): `hasError` is still true, but `showAccessWarning` is false because
 *   the policy is not `unknown`, so `showLoading` stays true. `isLoaded` never becomes true
 *   after an error, so this is not a brief flash before the real state settles, it is where the
 *   component stays: a permanently broken image rendered identically to one that is still
 *   loading, forever, with no error surfaced at all. `unknown` is the one access policy this
 *   component treats as worth explaining; every other policy, including the default, hides the
 *   same failure behind a spinner.
 */
export const ImagePreviewStates: Story = {
  name: 'ImagePreview: loaded, explained failure, silent failure',
  render: () => (
    <Flex gap={4} wrap="wrap">
      <Stack gap={2} style={{width: 220}}>
        <Text size={1} weight="semibold">
          Loaded
        </Text>
        <ImagePreview alt="A demo landscape" src={demoImageDataUri} />
      </Stack>
      <Stack gap={2} style={{width: 220}}>
        <Text size={1} weight="semibold">
          Failed, accessPolicy=&quot;unknown&quot;: explained
        </Text>
        <ImagePreview
          alt="A broken reference"
          src="/definitely-not-a-real-image-asset.jpg"
          accessPolicy="unknown"
        />
      </Stack>
      <Stack gap={2} style={{width: 220}}>
        <Text size={1} weight="semibold">
          Failed, accessPolicy=&quot;public&quot; (the default): silent, stuck loading
        </Text>
        <ImagePreview alt="A broken reference" src="/definitely-not-a-real-image-asset.jpg" />
      </Stack>
    </Flex>
  ),
}

/**
 * `ImageInputHotspotInput` (ImageInput/ImageInputHotspotInput.tsx) is gated on form focus, not
 * a local boolean: `handleOpenDialog` calls `onPathFocus(['hotspot'])` (`ImageInput.tsx:199-201`),
 * and the dialog only mounts once `focusPath` points at `hotspot` (`ImageInput.tsx:512`). Its
 * props are the live `imageInputProps` `BaseImageInput` already holds,
 * not a shape a story can plausibly hand-construct, so this reaches it the way an author does:
 * a real, bound, hotspot-enabled image field, with a `play` click on the real crop button
 * (`ImageActionsMenu`'s `data-testid="options-menu-edit-details"`). The dialog chrome (header,
 * close, `PresenceOverlay`) is real. Its pixels are not: `ImageToolInput` builds its URL from
 * the bound asset's `cdn.sanity.io` reference the same way `ImageInputPreview` does, which
 * cannot resolve offline (see `Forms & Input/ImageInput`'s mocking-boundary note). Real hotspot
 * pixels live in `Forms & Input/ImageTool`, which loads a self-contained data URI instead.
 */
export const HotspotDialog: Story = {
  name: 'ImageInputHotspotInput, opened for real',
  render: () => (
    <FieldDemo documentType="imageFieldDoc" initialDocument={{image: boundImageValue}} />
  ),
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('options-menu-edit-details'))
    await within(canvasElement.ownerDocument.body).findByText('Edit hotspot and crop')
  },
}

/**
 * In context: `ImageInputAsset.tsx:82-113`'s own composition, reproduced with the pieces this
 * page covers, `ImagePreview`, `ImageAccessPolicy` and `ImageActionsMenu`, stacked in one
 * `position: relative` box exactly as the real `BaseImageInput` stacks them. Unlike the
 * whole-field `ImageInput` page, `ImagePreview` here is handed the `ImageTool` demo data URI
 * instead of a `cdn.sanity.io` reference, so the pixels genuinely load: the private badge sits
 * top-left over real pixels, the crop/kebab toolbar sits top-right, exactly where an author
 * would meet them on a real cover image.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => <ComposedImageStage />,
}
