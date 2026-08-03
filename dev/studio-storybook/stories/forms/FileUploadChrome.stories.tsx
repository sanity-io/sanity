import {DownloadIcon} from '@sanity/icons/Download'
import {TrashIcon} from '@sanity/icons/Trash'
import {
  type Asset,
  type AssetSource,
  type AssetSourceComponentProps,
  type AssetSourceUploaderClass,
  type FileSchemaType,
  type Reference,
  type SchemaType,
  type UploadState,
} from '@sanity/types'
import {Box, Card, Flex, Inline, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {NEVER, of} from 'rxjs'
import {FormBuilderContext} from 'sanity/_singletons'
import {userEvent, within} from 'storybook/test'

import {type FormBuilderContextValue} from '../../../../packages/sanity/src/core/form/FormBuilderContext'
// Real components from real paths (org contract §8): the shared chrome behind every
// file and image field, factored out of `FileInput`/`ImageInput` so both fields (and
// the video field the media-library plugin adds) render the same asset-service seam.
import {AccessPolicyBadge} from '../../../../packages/sanity/src/core/form/inputs/files/common/AccessPolicyBadge'
import {AssetSourceDialog} from '../../../../packages/sanity/src/core/form/inputs/files/common/AssetSourceDialog'
import {DropMessage} from '../../../../packages/sanity/src/core/form/inputs/files/common/DropMessage'
import {FileInputButton} from '../../../../packages/sanity/src/core/form/inputs/files/common/FileInputButton/FileInputButton'
import {FileInputMenuItem} from '../../../../packages/sanity/src/core/form/inputs/files/common/FileInputMenuItem/FileInputMenuItem'
import {OptionsMenuPopover} from '../../../../packages/sanity/src/core/form/inputs/files/common/OptionsMenuPopover'
import {PlaceholderText} from '../../../../packages/sanity/src/core/form/inputs/files/common/PlaceholderText'
import {UploadDestinationPicker} from '../../../../packages/sanity/src/core/form/inputs/files/common/UploadDestinationPicker'
import {UploadProgress} from '../../../../packages/sanity/src/core/form/inputs/files/common/UploadProgress'
import {UploadWarning} from '../../../../packages/sanity/src/core/form/inputs/files/common/UploadWarning'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {BOUND_FILE_REF, fileAssetFixtures} from '../../lib/mockAssetFixtures'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Shared fixtures ──────────────────────────────────────────────────────────────
   A minimal schema-type cast, in the same spirit as `AssetSourceBrowser.stories.tsx`'s
   `fileSchemaType`: every component here reads at most a handful of fields off it
   (`.title`, `.options.accept`, `.name` for the file/image discriminator), so a literal
   object cast stands in for the real compiled schema type without fabricating one. */

const fileSchemaType = {
  name: 'file',
  title: 'Attachment',
  jsonType: 'object' as const,
} as unknown as FileSchemaType

const boundFileAsset = fileAssetFixtures[0] as unknown as Asset
const boundFileReference: Reference = {_type: 'reference', _ref: BOUND_FILE_REF}

const meta: Meta = {
  title: 'Forms & Input/File Upload Chrome',
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'These ten small pieces are the entire moment-to-moment feedback loop an author ' +
            'watches during an upload, and two of them disagree with themselves or with each ' +
            'other about what state is actually on screen.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/files/common/` (ten pieces: `AssetSourceDialog`, `UploadDestinationPicker`, `AccessPolicyBadge`, `DropMessage`, `OptionsMenuPopover`, `PlaceholderText`, `UploadProgress`, `UploadWarning`, `FileInputButton`, `FileInputMenuItem`) |',
          '| Tier | mostly CHROME; `AssetSourceDialog` and `UploadDestinationPicker` are SERVICE (they orchestrate a real asset-source hand-off, not just render one) |',
          '| Patterns | `upload-chrome` |',
          '',
          'The shared parts `FileInput` and `ImageInput` are both built from. Neither field ' +
            'owns a drop message, a stale-upload warning, or a private-asset badge, they each ' +
            'mount the same ten small pieces from this folder, so a fix or a defect here shows up ' +
            'in both fields at once.',
          '',
          'Each story below is that component read on its own terms: every return traced, every ' +
            'branch reached through the props that actually drive it in production. Two findings ' +
            'surfaced.',
          '',
          "<details><summary><b>`PlaceholderText`'s reject-count branch is dead under the only " +
            'real caller.</b></summary>',
          '',
          '`UploadPlaceholder.tsx:178-183` passes `directUploads`, `hoveringFiles`, `readOnly` ' +
            'and `type`, never `acceptedFiles` or `rejectedFilesCount`. Both props exist on ' +
            '`PlaceholderText`, both have real conditional logic for them, and neither can be ' +
            'non-undefined in the one place this component is mounted. The story below reaches ' +
            'that branch anyway, by calling the component directly with props no caller supplies, ' +
            'evidence about the source, not the product.',
          '',
          '</details>',
          '',
          '<details><summary><b>The same component disagrees with itself about which prop to ' +
            'check first.</b></summary>',
          '',
          '`messageIcon` tests `readOnly` before `directUploads === false`; `messageText` tests ' +
            'them in the opposite order. Set both at once, a read-only field whose config also ' +
            'disables direct uploads, which schema and workspace config allow independently, and ' +
            'the icon says "read only" while the text says "can\'t upload files here". See the ' +
            'matrix story for the mismatched pair, live.',
          '',
          '</details>',
          '',
          '> **Why it matters:** these are the pieces an author actually watches during an ' +
            'upload, the placeholder that invites a drop, the message that appears while ' +
            'dragging, the bar that tracks progress, the warning that appears if it stalls. None ' +
            'of them is complicated on its own; together they are the entire moment-to-moment ' +
            'feedback loop for whether a file made it, and a mismatch or a dead branch in any one ' +
            'of them is a mismatch an author sees mid-upload, not a defect that only shows up in ' +
            'code review.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:forms',
    'chapter:cms',
    'pattern:upload-chrome',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

/* ════════════════════════════════════════════════════════════════════════════════
   AssetSourceDialog: the dispatcher that decides whether an asset-source plugin
   mounts empty or pre-loaded, and independently carries an "open in source" asset
   through regardless of that decision.

   Returns (2): `WithReferencedAsset` branch when `value.asset && observeAsset`
   (AssetSourceDialog.tsx:145-155); `renderWithoutAsset()` otherwise (:157).
   ════════════════════════════════════════════════════════════════════════════════ */

/**
 * A fixture standing in for a real asset-source plugin's `component` - it renders
 * whatever it is handed rather than pretending to be a picker UI, which is the
 * legitimate way to story a dispatcher: the values it computed (`dialogHeaderTitle`
 * from i18n, the `accept` fallback, which assets arrived pre-selected) are the
 * subject; the picker UI itself belongs to whichever plugin is registered.
 */
function AssetSourceProbe(props: AssetSourceComponentProps) {
  const {action, assetType, dialogHeaderTitle, accept, selectedAssets, assetToOpen, uploader} =
    props
  return (
    <Card padding={4} radius={2} border style={{width: 360}} data-testid="asset-source-probe">
      <Stack gap={3}>
        <Text size={1} weight="medium">
          {dialogHeaderTitle}
        </Text>
        <Text size={1} muted>
          action: {action} · assetType: {assetType} · accept: {accept || '(any)'}
        </Text>
        <Text size={1} muted>
          uploader: {uploader ? 'picker mode (uploader supplied)' : 'component mode (none)'}
        </Text>
        <Text size={1} muted data-testid="probe-selected-assets">
          selectedAssets:{' '}
          {selectedAssets.length > 0
            ? selectedAssets.map((a) => a.originalFilename).join(', ')
            : 'none'}
        </Text>
        <Text size={1} muted data-testid="probe-asset-to-open">
          assetToOpen: {assetToOpen ? assetToOpen.originalFilename : 'none'}
        </Text>
      </Stack>
    </Card>
  )
}

const probeSource: AssetSource = {
  name: 'probe-source',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'Probe source',
  component: AssetSourceProbe,
}

export const AssetSourceDialogNewSelection: Story = {
  name: 'AssetSourceDialog - selecting a new asset',
  parameters: {
    docs: {
      description: {
        story:
          'No bound value, so `value?.asset && observeAsset` (:145) is false and the dialog takes the plain `renderWithoutAsset()` branch (:157): the source component mounts immediately with `selectedAssets: []`. This is the everyday "Upload" or "Browse" click on an empty field.',
      },
    },
  },
  render: () => (
    <AssetSourceDialog
      action="select"
      assetType="file"
      schemaType={fileSchemaType}
      selectedAssetSource={probeSource}
      onClose={() => undefined}
      onChangeAction={() => undefined}
      onSelect={() => undefined}
    />
  ),
}

export const AssetSourceDialogWaitingForReferencedAsset: Story = {
  name: 'AssetSourceDialog - waiting for the referenced asset',
  parameters: {
    docs: {
      description: {
        story:
          'A bound `value.asset` plus an `observeAsset` that never emits (an `rxjs.NEVER`, standing in for a slow network) takes the `WithReferencedAsset` branch (:145-153). `WithReferencedAsset` itself renders `documentId && asset ? children(asset) : waitPlaceholder` - with no asset yet, this shows the `waitPlaceholder` prop verbatim rather than mounting the source component blind. Nothing else on this page exercises `waitPlaceholder`; without it this state would render nothing at all.',
      },
    },
  },
  render: () => (
    <AssetSourceDialog
      action="select"
      assetType="file"
      schemaType={fileSchemaType}
      selectedAssetSource={probeSource}
      value={{asset: boundFileReference}}
      observeAsset={() => NEVER}
      waitPlaceholder={
        <Card padding={4} radius={2} border tone="transparent" style={{width: 360}}>
          <Text size={1} muted>
            Loading referenced asset…
          </Text>
        </Card>
      }
      onClose={() => undefined}
      onChangeAction={() => undefined}
      onSelect={() => undefined}
    />
  ),
}

export const AssetSourceDialogReplacingResolvedAsset: Story = {
  name: 'AssetSourceDialog - replacing a resolved asset',
  parameters: {
    docs: {
      description: {
        story:
          'The same bound value, but `observeAsset` now resolves synchronously (`rxjs.of(asset)`, standing in for an already-cached read). `WithReferencedAsset` calls `children(asset)`, which is `renderWithAsset` (:132-135): the source component mounts with `selectedAssets: [asset]` pre-filled, so a "Replace" click opens the picker already showing what is bound today.',
      },
    },
  },
  render: () => (
    <AssetSourceDialog
      action="select"
      assetType="file"
      schemaType={fileSchemaType}
      selectedAssetSource={probeSource}
      value={{asset: boundFileReference}}
      observeAsset={() => of(boundFileAsset)}
      onClose={() => undefined}
      onChangeAction={() => undefined}
      onSelect={() => undefined}
    />
  ),
}

export const AssetSourceDialogOpenInSourceBypassesTheGate: Story = {
  name: 'AssetSourceDialog - "open in source" bypasses the value/observeAsset gate',
  parameters: {
    docs: {
      description: {
        story:
          "`assetToOpen` is set from the `openInSourceAsset` prop unconditionally, inside `commonProps` (:102-116), completely outside the `value?.asset && observeAsset` branch that decides `selectedAssets`. Here `openInSourceAsset` is set and neither `value` nor `observeAsset` is - so the dialog still takes the `renderWithoutAsset()` branch (`selectedAssets: []`), while `assetToOpen` carries the asset through regardless. Compare the probe's two bottom lines against the story above: this is the one state on the page where they disagree - `selectedAssets` is empty while `assetToOpen` is populated.",
      },
    },
  },
  render: () => (
    <AssetSourceDialog
      action="openInSource"
      assetType="file"
      schemaType={fileSchemaType}
      selectedAssetSource={probeSource}
      openInSourceAsset={boundFileAsset}
      onClose={() => undefined}
      onChangeAction={() => undefined}
      onSelect={() => undefined}
    />
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   UploadDestinationPicker: asks which configured source an upload should go to,
   when a field or array has more than one that accepts direct uploads.

   Returns (2): `null` when no upload-capable source exists (:43-45); the `Dialog`
   otherwise (:47-87). Mounted by `uploadTarget.tsx:352-358`, gated on
   `showAssetSourceDestinationPicker`, which fires when a multi-source drop or paste
   needs a destination decided before the upload can start.
   ════════════════════════════════════════════════════════════════════════════════ */

const uploadCapableSource: AssetSource = {
  name: 'sanity-upload',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'Upload',
  Uploader: {} as unknown as AssetSourceUploaderClass,
  component: () => null,
}

const componentModeSource: AssetSource = {
  name: 'external-plugin',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'External plugin',
  uploadMode: 'component',
  component: () => null,
}

/** Neither `Uploader` nor `uploadMode: 'component'` - `hasUploadSupport` excludes it. */
const browseOnlySource: AssetSource = {
  name: 'media-library',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'Media Library',
  component: () => null,
}

export const UploadDestinationPickerEmpty: Story = {
  name: 'UploadDestinationPicker - no upload-capable sources',
  parameters: {
    docs: {
      description: {
        story:
          '`getAssetSourcesWithUpload(assetSources).length === 0` (:43): the component renders nothing at all, not even a message. A field whose only configured source is browse-only (no `Uploader`, no `uploadMode: "component"`) never shows this picker, even mid-drag.',
      },
    },
  },
  render: () => (
    <Card border padding={3} radius={0} data-testid="destination-picker-empty" style={{width: 320}}>
      <UploadDestinationPicker assetSources={[browseOnlySource]} text="Upload files to:" />
    </Card>
  ),
}

export const UploadDestinationPickerChoosing: Story = {
  name: 'UploadDestinationPicker - choosing a destination',
  parameters: {
    docs: {
      description: {
        story:
          "Three configured sources, one of them browse-only: the Dialog lists only the two that pass `getAssetSourcesWithUpload` (:21), each as a full-width bleed `Button`. Escape closes it via a global keydown listener (`useGlobalKeyDown`, :35-41) rather than the Dialog's own escape handling - press Escape below and watch the status line change. Rendered directly rather than behind a trigger: the real caller (`uploadTarget.tsx:352`) mounts it exactly this way, conditionally, with no open/closed prop of its own - mounting IS showing it.",
      },
    },
  },
  render: function ChoosingDestination(_args, {viewMode, id, name}) {
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    return <ChoosingDestinationDemo />
  },
}

function ChoosingDestinationDemo() {
  const [status, setStatus] = useState('open')
  return (
    <Stack gap={3}>
      <Text size={1} data-testid="destination-picker-status">
        Status: {status}
      </Text>
      <UploadDestinationPicker
        assetSources={[uploadCapableSource, componentModeSource, browseOnlySource]}
        text="Upload files to:"
        onSelectAssetSource={(source) => setStatus(source ? `selected ${source.name}` : 'cleared')}
        onClose={() => setStatus('closed (escape)')}
      />
    </Stack>
  )
}

export const UploadDestinationPickerEscapeCloses: Story = {
  name: 'UploadDestinationPicker - Escape closes it',
  parameters: {
    docs: {
      description: {
        story:
          'Same picker, played: presses Escape and reads the status line back to confirm `onClose` fired via the global keydown listener rather than a Dialog-native mechanism.',
      },
    },
  },
  render: function EscapeCloses(_args, {viewMode, id, name}) {
    // The sibling above already stands `OverlayStoryNotice` in on the docs page; this story
    // renders the same picker and needed the same treatment. `UploadDestinationPicker` mounts
    // `@sanity/ui`'s `Dialog` at its default `position: fixed`, portaled to `document.body`,
    // with no open/closed prop of its own: mounting IS showing it. This story's `play` skips
    // docs, so the Escape that closes it on the canvas never ran there and the dialog simply
    // stayed. Measured on the docs page before this change: a 1280x900 backdrop `Layer` and a
    // 640x876 `DialogCard` at page origin, neither inside any `.docs-story` canvas, parked over
    // the meta description and dimming the two findings stated there. Ledger #50, again.
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    return <ChoosingDestinationDemo />
  },
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await canvas.findByText('Status: open')
    await userEvent.keyboard('{Escape}')
    await canvas.findByText('Status: closed (escape)')
  },
}

/* ════════════════════════════════════════════════════════════════════════════════
   AccessPolicyBadge: a single, unconditional "Private asset" label.

   Return (1): AccessPolicyBadge.tsx:13-26 - one JSX tree, its only branch being
   `hideBackground` choosing `Box` vs `Card` as the wrapper. It takes no
   `accessPolicy` prop; correctness is entirely the caller's responsibility.
   ════════════════════════════════════════════════════════════════════════════════ */

export const AccessPolicyBadgeVariants: Story = {
  name: 'AccessPolicyBadge - with and without its background',
  parameters: {
    docs: {
      description: {
        story:
          "The component's entire prop surface is `hideBackground`. With it `false` (default), the badge is a muted `Card` that can sit on its own; with it `true`, the same content sits in a bare `Box` for a caller that already supplies a background - `ImageInput`'s bound-asset menu overlay is exactly that caller.",
      },
    },
  },
  render: () => (
    <Inline gap={4}>
      <Stack gap={2} style={{textAlign: 'center'}}>
        <AccessPolicyBadge />
        <Text size={0} muted>
          default (own background)
        </Text>
      </Stack>
      <Stack gap={2} style={{textAlign: 'center'}}>
        <Card padding={3} tone="positive">
          <AccessPolicyBadge hideBackground />
        </Card>
        <Text size={0} muted>
          hideBackground (caller supplies one)
        </Text>
      </Stack>
    </Inline>
  ),
}

export const AccessPolicyBadgeCanBeWrong: Story = {
  name: 'AccessPolicyBadge - cannot tell a correct mount from a mistaken one',
  parameters: {
    docs: {
      description: {
        story:
          'This component takes no `accessPolicy` prop. Both callers (`FileActionsMenu.tsx:73`, `ImageAccessPolicy.tsx:16-22`) gate it themselves with `accessPolicy === \'private\'` before mounting it - `useAccessPolicy` actually resolves one of four values (`checking` | `private` | `public` | `unknown`), and only the caller\'s own `if` stands between "private" and the other three. The two panels below are pixel-identical on purpose: one represents a correctly gated mount, the other a hypothetical caller that forgot the check (or mounted it while the policy was still `checking`). Nothing in this component, or in this story, can tell them apart - the badge always says "Private asset" the moment it exists in the tree.',
      },
    },
  },
  render: () => (
    <Inline gap={4}>
      <Stack gap={2} style={{textAlign: 'center'}}>
        <AccessPolicyBadge />
        <Text size={0} muted>
          accessPolicy really is &apos;private&apos;
        </Text>
      </Stack>
      <Stack gap={2} style={{textAlign: 'center'}}>
        <AccessPolicyBadge />
        <Text size={0} muted>
          accessPolicy is &apos;checking&apos; or &apos;public&apos; (hypothetical bug)
        </Text>
      </Stack>
    </Inline>
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   DropMessage: the banner shown while files are dragged over a drop target.

   Return (1): DropMessage.tsx:33-77 - one JSX tree; `acceptedFiles.length > 0`
   (:35) picks the accept/reject content, and a nested `rejectedFilesCount > 0`
   (:48) adds a secondary line when the drag is mixed. Requires `useFormBuilder()`
   (:26), so these stories seed a minimal `FormBuilderContext` value directly
   rather than pulling in the full harness for two fields it reads.
   ════════════════════════════════════════════════════════════════════════════════ */

function makeFormBuilderValue(opts: {accept?: string}) {
  const sources: AssetSource[] = [uploadCapableSource]
  return {
    __internal: {
      file: {assetSources: sources, directUploads: true, accept: opts.accept},
      image: {assetSources: sources, directUploads: true},
    },
  } as unknown as FormBuilderContextValue
}

const pdfOnlyType = {
  name: 'file',
  jsonType: 'object' as const,
  options: {accept: '.pdf'},
} as unknown as SchemaType

const anyFileType = {name: 'file', jsonType: 'object' as const} as unknown as SchemaType

export const DropMessageAllAccepted: Story = {
  name: 'DropMessage - every file can be uploaded here',
  parameters: {
    docs: {
      description: {
        story:
          'Two files, no `accept` restriction on the schema type: `resolveUploadAssetSources` (called internally, :27-29) accepts both, so `rejectedFilesCount` is 0 and only the upload prompt shows, pluralised via the `-multi` i18n key.',
      },
    },
  },
  render: () => (
    <FormBuilderContext.Provider value={makeFormBuilderValue({})}>
      <Card padding={4} radius={2} border style={{width: 360}}>
        <DropMessage
          hoveringFiles={[
            {type: 'application/pdf', name: 'report.pdf'},
            {type: 'application/pdf', name: 'appendix.pdf'},
          ]}
          types={[anyFileType]}
        />
      </Card>
    </FormBuilderContext.Provider>
  ),
}

export const DropMessageMixed: Story = {
  name: 'DropMessage - some files rejected',
  parameters: {
    docs: {
      description: {
        story:
          'The schema type restricts to `.pdf`; one hovering file matches, one (`photo.png`) does not. `acceptedFiles.length > 0` still takes the upload-prompt branch, but the secondary rejected line (:48-61) now renders below it - DropMessage always surfaces a mixed drag, showing both what will upload and what will not. Contrast this with the `PlaceholderText` matrix story below, whose idle-state equivalent does not.',
      },
    },
  },
  render: () => (
    <FormBuilderContext.Provider value={makeFormBuilderValue({})}>
      <Card padding={4} radius={2} border style={{width: 360}}>
        <DropMessage
          hoveringFiles={[
            {type: 'application/pdf', name: 'report.pdf'},
            {type: 'image/png', name: 'photo.png'},
          ]}
          types={[pdfOnlyType]}
        />
      </Card>
    </FormBuilderContext.Provider>
  ),
}

export const DropMessageNoneAccepted: Story = {
  name: 'DropMessage - nothing here can be uploaded',
  parameters: {
    docs: {
      description: {
        story:
          "Every hovering file fails the schema's `.pdf` restriction: `acceptedFiles.length === 0` (:35), so the component takes its other top-level branch entirely - a differently-worded, differently-iconed message with no upload icon at all.",
      },
    },
  },
  render: () => (
    <FormBuilderContext.Provider value={makeFormBuilderValue({})}>
      <Card padding={4} radius={2} border style={{width: 360}}>
        <DropMessage
          hoveringFiles={[
            {type: 'image/png', name: 'photo.png'},
            {type: 'image/gif', name: 'meme.gif'},
          ]}
          types={[pdfOnlyType]}
        />
      </Card>
    </FormBuilderContext.Provider>
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   OptionsMenuPopover: the shared Popover + ContextMenuButton + Menu behind every
   file/image actions menu.

   Return (1): OptionsMenuPopover.tsx:81-98 - one JSX tree; `isMenuOpen` is fully
   controlled by the caller, so "closed" and "open" are the same render with a
   different prop, not two branches inside the component.
   ════════════════════════════════════════════════════════════════════════════════ */

function OptionsMenuDemo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = {current: null} as React.RefObject<HTMLButtonElement | null>
  return (
    <Flex justify="flex-end" style={{width: 240}}>
      <OptionsMenuPopover
        ariaLabelKey="inputs.file.actions-menu.file-options.aria-label"
        id="upload-chrome-options-menu"
        isMenuOpen={isMenuOpen}
        onMenuOpen={setIsMenuOpen}
        menuButtonRef={menuButtonRef}
      >
        <MenuItem icon={DownloadIcon} text="Download" />
        <MenuItem icon={TrashIcon} text="Remove" tone="critical" />
      </OptionsMenuPopover>
    </Flex>
  )
}

export const OptionsMenuPopoverOpen: Story = {
  name: 'OptionsMenuPopover - open, played',
  parameters: {
    docs: {
      description: {
        story:
          'The exact composition `FileActionsMenu.tsx` uses (:74-81): a controlled `isMenuOpen` boolean, a `ContextMenuButton` trigger, and a plain `Menu` of `MenuItem`s as children. Played open on mount so the real menu content is visible without a click - the same "Download" / "Remove" pairing a real file card offers.',
      },
    },
  },
  // `play` skips docs mode (below), so the docs page never ran the click that opens this menu -
  // it rendered the same closed button the story title promises is "open, played". Same
  // `OverlayStoryNotice` stand-in the two `UploadDestinationPicker` stories above already use.
  render: function OptionsMenuPopoverOpenRender(_args, {viewMode, id, name}) {
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    return <OptionsMenuDemo />
  },
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('options-menu-button'))
    await within(canvasElement.ownerDocument.body).findByText('Download')
  },
}

/* ════════════════════════════════════════════════════════════════════════════════
   PlaceholderText: the idle/dragging prompt inside the empty upload placeholder.

   Return (1): PlaceholderText.tsx:69-79 - one JSX tree; `messageIcon` and
   `messageText` are independent `useMemo`s (:31-44, :46-67) that branch on
   overlapping but NOT identically-ordered conditions. `UploadPlaceholder.tsx:178-183`
   (the only real caller) never passes `acceptedFiles`/`rejectedFilesCount`, so two
   of the branches below exist in source but not in any shipped path.
   ════════════════════════════════════════════════════════════════════════════════ */

function PlaceholderCell(props: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={2} style={{textAlign: 'center', minWidth: 220}}>
      <Card padding={3} radius={2} border style={{minHeight: 56}}>
        {props.children}
      </Card>
      <Text size={0} muted>
        {props.label}
      </Text>
    </Stack>
  )
}

export const PlaceholderTextMatrix: Story = {
  name: 'PlaceholderText - the message matrix',
  parameters: {
    docs: {
      description: {
        story: [
          'Every reachable appearance in one grid, captioned with the exact props behind it.',
          '',
          'The last two cells are the two findings from the top of this page, made visible: **"some rejected"** only renders `PlaceholderText`\'s own reject message when `acceptedFiles` is *entirely empty* (`acceptedFiles.length > 0` is checked first and returns early, :56-58) - a genuinely mixed accepted-and-rejected drag falls through to the plain default prompt, saying nothing about the rejection at all. Compare it against `DropMessage`\'s mixed story above, which always shows both halves. And **"read-only + uploads disabled"** shows the icon/text mismatch directly: `messageIcon` checks `readOnly` first (:32-34) so the icon reads read-only, while `messageText` checks `directUploads === false` first (:47-49) so the text reads upload-not-supported - the one state where both props are true renders an icon and a sentence that disagree.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Flex gap={3} wrap="wrap">
      <PlaceholderCell label="default, file field">
        <PlaceholderText type="file" />
      </PlaceholderCell>
      <PlaceholderCell label="default, image field">
        <PlaceholderText type="image" />
      </PlaceholderCell>
      <PlaceholderCell label="read only">
        <PlaceholderText type="file" readOnly />
      </PlaceholderCell>
      <PlaceholderCell label="uploads not supported (directUploads=false)">
        <PlaceholderText type="file" directUploads={false} />
      </PlaceholderCell>
      <PlaceholderCell label="dragging, accepted (hoveringFiles + directUploads)">
        <PlaceholderText
          type="file"
          hoveringFiles={[{type: 'application/pdf', name: 'report.pdf'}]}
          acceptedFiles={[{type: 'application/pdf', name: 'report.pdf'}]}
          directUploads
        />
      </PlaceholderCell>
      <PlaceholderCell label="dragging, all rejected (acceptedFiles: [], rejectedFilesCount: 2), unreachable from UploadPlaceholder today">
        <PlaceholderText
          type="file"
          hoveringFiles={[
            {type: 'image/png', name: 'photo.png'},
            {type: 'image/gif', name: 'meme.gif'},
          ]}
          acceptedFiles={[]}
          rejectedFilesCount={2}
          directUploads
        />
      </PlaceholderCell>
      <PlaceholderCell label="read-only AND uploads disabled at once, icon says read-only, text says can't upload">
        <PlaceholderText type="file" readOnly directUploads={false} />
      </PlaceholderCell>
    </Flex>
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   UploadProgress: the in-flight progress bar.

   Return (1): UploadProgress.tsx:28-69 - one JSX tree, always: a filename, a
   `LinearProgress`, and an optional Cancel button. `useEffect` (:21-25) compares
   `uploadState.updatedAt` against `STALE_UPLOAD_MS` (2 minutes,
   `files/constants.ts`) and calls `onStale`, but the render is IDENTICAL either
   way - there is no visual "stalled" state in this component at all.
   ════════════════════════════════════════════════════════════════════════════════ */

function UploadProgressDemo(props: {updatedAt: string; progress: number; withCancel: boolean}) {
  const {updatedAt, progress, withCancel} = props
  const [stale, setStale] = useState(false)
  const uploadState: UploadState = {
    progress,
    createdAt: updatedAt,
    updatedAt,
    file: {name: 'annual-report-2026.pdf', type: 'application/pdf'},
  }
  return (
    <Stack gap={3}>
      <UploadProgress
        uploadState={uploadState}
        onCancel={withCancel ? () => undefined : undefined}
        onStale={() => setStale(true)}
      />
      <Text size={1} muted data-testid="onstale-indicator">
        onStale fired: {stale ? 'yes' : 'no'}
      </Text>
    </Stack>
  )
}

export const UploadProgressActive: Story = {
  name: 'UploadProgress - actively progressing',
  parameters: {
    docs: {
      description: {
        story:
          '`updatedAt` is "now", well under the 2-minute stale threshold, so the mount-time effect never calls `onStale` - the indicator below stays "no". A live `Cancel` button is present because `onCancel` is supplied.',
      },
    },
  },
  render: () => (
    <UploadProgressDemo updatedAt={new Date().toISOString()} progress={42} withCancel />
  ),
}

export const UploadProgressStaleOnMount: Story = {
  name: 'UploadProgress - stalled, rendered identically',
  parameters: {
    docs: {
      description: {
        story:
          'Same component, `updatedAt` five minutes in the past. The progress bar and filename ' +
          'render **exactly as above** - same markup, same percentage - because ' +
          '`UploadProgress` has no branch for "stale". The only observable difference is the ' +
          '`onStale` indicator flipping to "yes", which happens because the effect keys off ' +
          '`uploadState.updatedAt` (:21-25) and this mounts with an already-stale value. The ' +
          'effect has no interval and no other trigger, so an upload that goes stale WHILE this ' +
          'component stays mounted - `updatedAt` simply stops changing - never re-fires the ' +
          'check, because nothing changes the dependency it watches. Detection here is a ' +
          'mount-time/prop-change fact, not a running clock. Also `onCancel` is omitted, so the ' +
          'Cancel button is absent - a stalled upload with no way to cancel it from here, until ' +
          'the parent notices `onStale` and offers `UploadWarning`\'s own "Clear upload" ' +
          'instead.',
      },
    },
  },
  render: () => (
    <UploadProgressDemo
      updatedAt={new Date(Date.now() - 5 * 60 * 1000).toISOString()}
      progress={17}
      withCancel={false}
    />
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   UploadWarning: the recovery banner for an upload `onStale` flagged.

   Return (1): UploadWarning.tsx:16-44 - one JSX tree, one prop
   (`onClearStale`). No branch: this is what "stale" looks like once the parent
   (`FileAsset.tsx:77-81`, `ImageInputAsset.tsx:86`) decides to show it.
   ════════════════════════════════════════════════════════════════════════════════ */

export const UploadWarningIncomplete: Story = {
  name: 'UploadWarning - incomplete upload',
  parameters: {
    docs: {
      description: {
        story:
          'The copy names the exact wait (`Math.ceil(STALE_UPLOAD_MS / 1000 / 60)` minutes, computed live rather than hardcoded) and says precisely what to do: "You can safely clear the incomplete upload and try uploading again." The one action is `Clear upload`, wired straight to `onClearStale`. Note where this is mounted in the real caller: `FileAsset.tsx:77-81` renders it ABOVE the still-visible `UploadProgress` when `isStale` is true, not instead of it - the stalled progress bar and this warning appear together, which is the pairing the closing story below shows.',
      },
    },
  },
  render: () => (
    <Box style={{width: 360}}>
      <UploadWarning onClearStale={() => undefined} />
    </Box>
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   FileInputButton: the persistent, visually-hidden native `<input type="file">`
   behind the single-source Upload button.

   Return (1): FileInputButton.tsx:40-56 - one JSX tree: a `Button` rendered as a
   `<label>`, wrapping a real, always-present `<input>` that CSS hides via
   `opacity: 0` and absolute positioning (`FileInputButton/styles.ts:24-39`), not
   `display: none` - the input keeps native focus/keyboard semantics, it is only
   invisible. Every mount gets its own `useId()`-derived id (:29), so two buttons
   on one page never collide even with no `id` prop passed.
   ════════════════════════════════════════════════════════════════════════════════ */

export const FileInputButtonStates: Story = {
  name: 'FileInputButton - enabled and disabled',
  parameters: {
    docs: {
      description: {
        story:
          'Two independent mounts, neither given an explicit `id` - each still works because `useId()` makes every instance unique. This is the real "Upload" button `UploadPlaceholder.tsx:121-133` renders for a single, picker-mode source.',
      },
    },
  },
  render: () => (
    <Inline gap={3}>
      <FileInputButton text="Upload" mode="ghost" onSelect={() => undefined} />
      <FileInputButton text="Upload" mode="ghost" disabled onSelect={() => undefined} />
    </Inline>
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   FileInputMenuItem: the menu-item variant of the same trigger, for when upload
   is one option among several rather than the only affordance.

   Return (1): FileInputMenuItem.tsx:35-44 - one JSX tree: a plain `MenuItem`
   whose `onClick` calls `openFilePicker` (:24-33). Unlike `FileInputButton`, there
   is no persistent `<input>` in the DOM at all - `openFilePicker` creates one
   imperatively on click, appends it to `document.body`, and removes it again on
   change or on a window-focus heuristic that infers cancellation.
   ════════════════════════════════════════════════════════════════════════════════ */

export const FileInputMenuItemStates: Story = {
  name: 'FileInputMenuItem - enabled and disabled',
  parameters: {
    docs: {
      description: {
        story:
          "Not played: clicking a real one calls `openFilePicker`, which opens the browser's native file dialog - not something a static build can safely automate. The disabled item short-circuits before that call (`if (disabled || !onSelect) return`, FileInputMenuItem.tsx:25), so its `onSelect` never fires and no picker ever opens.",
      },
    },
  },
  render: () => (
    // A real `Menu` ancestor, because `FileInputMenuItem` renders a `MenuItem`, which calls
    // `useMenu()` and throws without one. Mounted bare it renders nothing and reports only
    // "useMenu(): missing context value", which says nothing about the component under study.
    <Card radius={2} shadow={2} style={{width: 220}}>
      <Menu>
        <FileInputMenuItem text="Upload" onSelect={() => undefined} />
        <FileInputMenuItem text="Upload" onSelect={() => undefined} disabled />
      </Menu>
    </Card>
  ),
}

/* ════════════════════════════════════════════════════════════════════════════════
   In context: the upload lifecycle in sequence.
   ════════════════════════════════════════════════════════════════════════════════ */

export const InContext: Story = {
  name: 'In context - the upload lifecycle in sequence',
  parameters: {
    docs: {
      description: {
        story:
          'Four of these pieces, in the order an author actually meets them, so the relationship between them reads in one glance rather than across four separate pages: the empty field waits (`PlaceholderText`), a file is dragged over it (`DropMessage`), the upload is in flight (`UploadProgress`), and it stalls (`UploadWarning` - shown, per `FileAsset.tsx:77-90`, ABOVE the still-visible progress bar rather than replacing it, since `UploadProgress` itself never changes its own render for a stale upload).',
      },
    },
  },
  render: () => (
    <Stack gap={4} style={{maxWidth: 420}}>
      <Stack gap={2}>
        <Text size={0} weight="medium">
          1. Idle - waiting for a file
        </Text>
        <Card padding={3} radius={2} border>
          <PlaceholderText type="file" />
        </Card>
      </Stack>

      <Stack gap={2}>
        <Text size={0} weight="medium">
          2. A file is dragged over the field
        </Text>
        <FormBuilderContext.Provider value={makeFormBuilderValue({})}>
          <Card padding={3} radius={2} border>
            <DropMessage
              hoveringFiles={[{type: 'application/pdf', name: 'annual-report-2026.pdf'}]}
              types={[anyFileType]}
            />
          </Card>
        </FormBuilderContext.Provider>
      </Stack>

      <Stack gap={2}>
        <Text size={0} weight="medium">
          3. Upload in progress
        </Text>
        <UploadProgress
          uploadState={{
            progress: 63,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            file: {name: 'annual-report-2026.pdf', type: 'application/pdf'},
          }}
          onCancel={() => undefined}
        />
      </Stack>

      <Stack gap={2}>
        <Text size={0} weight="medium">
          4. It stalls - the warning appears ABOVE the still-visible progress bar
        </Text>
        <Stack gap={2}>
          <UploadWarning onClearStale={() => undefined} />
          <UploadProgress
            uploadState={{
              progress: 63,
              createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              file: {name: 'annual-report-2026.pdf', type: 'application/pdf'},
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  ),
}
