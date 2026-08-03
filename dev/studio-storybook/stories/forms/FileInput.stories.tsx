import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useId, useMemo, useState} from 'react'

// Real component from a real path (org contract §8): the file field is rendered by the
// live FormBuilder, which resolves `file` → `StudioFileInput` → `BaseFileInput` through
// the real input resolver (`studio/inputResolver/defaultInputs.ts`).
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {
  boundFileValue,
  fileAssetFixtures,
  invalidFileValue,
  uploadingFileValue,
  WithAssetLimitUpsell,
} from '../../lib/mockAssetFixtures'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * One document type per state we drive off the schema itself (read-only-ness and the
 * required rule are schema facts, so the FormBuilder tones them for real):
 * - `fileDoc` — a plain file field
 * - `fileReadOnlyDoc` — the same field marked `readOnly`
 * - `fileRequiredDoc` — the same field carrying a `required()` rule
 */
const schemaTypes = [
  {
    name: 'fileDoc',
    title: 'Document with a file',
    type: 'document',
    fields: [{name: 'file', title: 'Attachment', type: 'file'}],
  },
  {
    name: 'fileReadOnlyDoc',
    title: 'Document with a read-only file',
    type: 'document',
    fields: [{name: 'file', title: 'Attachment', type: 'file', readOnly: true}],
  },
  {
    name: 'fileRequiredDoc',
    title: 'Document with a required file',
    type: 'document',
    fields: [
      {
        name: 'file',
        title: 'Attachment',
        type: 'file',
        validation: (rule: {required: () => unknown}) => rule.required(),
      },
    ],
  },
  // The in-context host: a real book document whose press-kit file sits beside a plain
  // Title, so the file field reads as one field of a document being edited.
  {
    name: 'bookRecord',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'pressKit', title: 'Press kit', type: 'file'},
    ],
  },
]

/** Seeds the preview store so the bound-asset story resolves its `sanity.fileAsset`. */
const previewStore = createMockDocumentPreviewStore({documents: fileAssetFixtures})

function FileDemo(props: {documentType?: string; value?: Record<string, unknown>}) {
  const {documentType = 'fileDoc', value} = props
  // Unique per mounted instance so the autodocs page (every story at once) does not emit
  // multiple form roots sharing id="root" and duplicate field ids.
  const id = `fb-file-${useId().replace(/:/g, '')}`
  // Per-mount deep clone of the fixture value. The harness seeds its document state from
  // `initialDocument` with a shallow spread, so passing the module-level fixture const
  // directly would make the mounted document's `file` *alias* that shared const. Cloning
  // gives every mount its own fixture universe: no story action can leak across mounts,
  // and the fixture stays pristine so remounting always re-enters the original state.
  // (`value` is a stable module reference, so this clones exactly once per mount.)
  const initialDocument = useMemo(
    () => (value ? {file: structuredClone(value)} : undefined),
    [value],
  )
  return (
    <WithAssetLimitUpsell>
      <div style={{maxWidth: 640}}>
        <FormBuilderHarness
          documentType={documentType}
          initialDocument={initialDocument}
          id={id}
          height="auto"
        />
      </div>
    </WithAssetLimitUpsell>
  )
}

/**
 * Wraps a {@link FileDemo} with a remount control so a state a viewer can *consume* — e.g.
 * clicking “Reset value” on the invalid-reference warning, which unsets the field — can be
 * re-entered without reloading the page. Bumping the mount `key` remounts the demo, and
 * because `FileDemo` deep-clones the fixture per mount, the story lands back in its
 * original state every time.
 */
function RevisitableFileDemo(props: {
  documentType?: string
  value?: Record<string, unknown>
  restoreLabel: string
}) {
  const {documentType, value, restoreLabel} = props
  const [mountKey, setMountKey] = useState(0)
  return (
    <Stack gap={3}>
      <FileDemo key={mountKey} documentType={documentType} value={value} />
      <Flex>
        <Button
          text={restoreLabel}
          mode="ghost"
          fontSize={1}
          onClick={() => setMountKey((key) => key + 1)}
        />
      </Flex>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Forms & Input/FileInput',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A file is authored as an attachment trapped in this document, not a first-class ' +
            'library item with its own identity and cross-document usage: the field shows a ' +
            'filename and a size, not where else the asset lives or what breaks if it is removed ' +
            'here.',
          '',
          '| | |',
          '|---|---|',
          '| Source | resolved via the real input resolver (`studio/inputResolver/defaultInputs.ts`): `file` → `StudioFileInput` → `BaseFileInput` |',
          '| Tier | SERVICE. The file field is a thin seam over an asset service (upload, browse, dataset/library). Sanity has already extracted Media Library as a separate app, which is exactly the decomposition boundary this input sits on: it owns a drop-target and a menu, and delegates identity/storage to a service behind a narrow interface (a reference to a `sanity.fileAsset`) |',
          "| Audit | 🔴 needs-work (`asset-lifecycle-reuse`). The asset is authored as an attachment trapped in this document rather than a first-class library item with its own identity, metadata and cross-document usage; the field surfaces a filename and a size, not the asset's lifecycle |",
          '| Patterns | `asset-lifecycle-reuse` |',
          '',
          'The field for attaching a file, a PDF, a zip, any binary, to a document: drop or ' +
            'browse to upload, and it stores a reference to the managed asset. Whenever a ' +
            'document needs a file hanging off it, a spec sheet, a press kit, a download, this is ' +
            'the field. It is deliberately thin: it owns a drop-target and a small actions menu, ' +
            'and hands everything about storage and identity to an asset service behind a narrow ' +
            'interface (a reference to a `sanity.fileAsset`). That seam is exactly the line ' +
            'Sanity drew when it extracted Media Library into its own app.',
          '',
          'These stories mount the real `FileInput` through a live `FormBuilder` ' +
            '(`lib/formBuilderHarness.tsx`): `file` resolves to `StudioFileInput` through ' +
            "`BaseFileInput` via the real input resolver, asset sources come from the workspace's " +
            'form config (`useSource().form.file`), and the bound-asset preview resolves its ' +
            '`sanity.fileAsset` through the fixture-backed `DocumentPreviewStore` ' +
            '(`observeFileAsset` through `observePaths`). The file card, filename, size, ' +
            'extension, actions menu, needs no pixels, so it renders fully offline.',
          '',
          'Mocking boundary: there is no asset backend, so the empty and mid-upload states ' +
            'render the pre-upload affordances honestly; the actual upload network round-trip is ' +
            'not exercised. The inputs call `useAssetLimitsUpsellContext()` at render, so the ' +
            'subtree is wrapped in an inert upsell provider (it never opens).',
          '',
          '> **Why it matters:** the file is authored as an attachment trapped in this document, ' +
            'not a first-class library item with its own identity and cross-document usage. The ' +
            'field shows a filename and a size, not where else the asset lives, or what breaks if ' +
            'it is removed here.',
          '',
          'The page closes in context: the file field as the Press kit of the "Anna Karenina" ' +
            'book, beside its Title, with a bound PDF asset resolved for real.',
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
    'pattern:asset-lifecycle-reuse',
    'audit:needs-work',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * Empty: the upload placeholder inside a drop-target card, the prompt text (“drag or
 * paste”), the Upload button, and (when the workspace has selectable sources) a Browse
 * affordance. Dropping/pasting a file targets a real upload the mock cannot complete, so
 * this is the pre-upload state only.
 */
export const Empty: Story = {
  render: () => <FileDemo />,
}

/**
 * A bound file asset resolved for real through the preview store: the file card shows the
 * original filename, size and an actions menu (browse / upload replacement / download /
 * copy URL / remove). This is the richest fully-offline file state, no bytes required.
 */
export const WithFile: Story = {
  name: 'With file (bound asset)',
  render: () => <FileDemo value={boundFileValue} />,
}

/**
 * Mid-upload: `_upload` present on the value drives the real `UploadProgress` bar
 * (filename + linear progress). Rendered from a fixture upload state, so no network is
 * involved, the component shows exactly what an in-flight upload looks like.
 */
export const Uploading: Story = {
  name: 'Uploading (progress state)',
  render: () => <FileDemo value={uploadingFileValue} />,
}

/**
 * The value carries an `asset` reference that is not a valid file source: the input
 * refuses to render a preview and shows `InvalidFileWarning` with a clear-value action,
 * the real corrupt-value guard, offline. Because that action unsets the field, a
 * "Restore broken reference" control remounts the demo so the error state is always
 * re-enterable without a page reload.
 */
export const InvalidFile: Story = {
  name: 'Invalid file reference',
  render: () => (
    <RevisitableFileDemo value={invalidFileValue} restoreLabel="Restore broken reference" />
  ),
}

/**
 * Read-only (from the schema): the drop-target is inert and the actions that would mutate
 * the asset are disabled, the real read-only tone, shown over a bound asset.
 */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => <FileDemo documentType="fileReadOnlyDoc" value={boundFileValue} />,
}

/**
 * A `required()` file with no asset: `validateDocument` runs for real in the harness and
 * marks the field, so the empty state renders in the error tone, the honest
 * schema-driven validation surface, not a hand-set marker.
 */
export const ErrorRequired: Story = {
  name: 'Error (required, empty)',
  render: () => <FileDemo documentType="fileRequiredDoc" />,
}

/**
 * **Recommended.** `asset-lifecycle-reuse`: the same bound file, reframed as a
 * library-first item, identity, where-used, and reuse are visible on the field, so the
 * asset reads as a managed object rather than an attachment trapped in this document.
 * Prop-driven illustration of the target; the field value it stands in for is the same
 * asset reference the real input already emits.
 */
export const RecommendedLibraryFirst: Story = {
  name: 'Recommended (library-first identity)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <div style={{maxWidth: 640}}>
      <Stack gap={3}>
        <Card border radius={2} padding={3}>
          <Stack gap={3}>
            <Flex align="center" justify="space-between" gap={3}>
              <Text size={1} weight="medium">
                annual-report-2026.pdf
              </Text>
              <Text size={0} muted>
                2.4 MB · PDF
              </Text>
            </Flex>
            <Card border radius={2} padding={2} tone="transparent">
              <Text size={0} muted>
                In library · used in 3 documents · uploaded May 2026 · alt/label editable here
              </Text>
            </Card>
          </Stack>
        </Card>
        <Card border radius={2} padding={3} tone="primary">
          <Text size={1}>
            The asset carries its own identity and usage. Replacing it here updates one library
            item; removing it from this document does not orphan the file.
          </Text>
        </Card>
      </Stack>
    </div>
  ),
}

/**
 * In context: the file field as the Press kit of the "Anna Karenina" book, sitting beside
 * the document's Title. A live `FormBuilder` over a real document with a bound
 * `sanity.fileAsset` resolved through the preview store, the file card shows its
 * filename, size and actions menu offline. This is the everyday moment of attaching a
 * download to a document, not an isolated state chip.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <WithAssetLimitUpsell>
      <div style={{maxWidth: 640}}>
        <FormBuilderHarness
          id="fb-file-in-context"
          documentType="bookRecord"
          initialDocument={{title: 'Anna Karenina', pressKit: structuredClone(boundFileValue)}}
          height="auto"
        />
      </div>
    </WithAssetLimitUpsell>
  ),
}
