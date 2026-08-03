import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useId} from 'react'

// Real component from a real path (org contract §8): the image field is rendered by the
// live FormBuilder, which resolves `image` → `StudioImageInput` → `BaseImageInput` via
// the real input resolver (`studio/inputResolver/defaultInputs.ts`).
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {
  boundImageValue,
  imageAssetFixtures,
  invalidImageValue,
  uploadingImageValue,
  WithAssetLimitUpsell,
} from '../../lib/mockAssetFixtures'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * All image fields enable `hotspot` (so the crop/hotspot affordance is present). One
 * document type per schema-driven state:
 * - `imageDoc` — a hotspot-enabled image field
 * - `imageReadOnlyDoc` — the same field marked `readOnly`
 * - `imageRequiredDoc` — the same field carrying a `required()` rule
 */
const schemaTypes = [
  {
    name: 'imageDoc',
    title: 'Document with an image',
    type: 'document',
    fields: [{name: 'image', title: 'Cover image', type: 'image', options: {hotspot: true}}],
  },
  {
    name: 'imageReadOnlyDoc',
    title: 'Document with a read-only image',
    type: 'document',
    fields: [
      {
        name: 'image',
        title: 'Cover image',
        type: 'image',
        options: {hotspot: true},
        readOnly: true,
      },
    ],
  },
  {
    name: 'imageRequiredDoc',
    title: 'Document with a required image',
    type: 'document',
    fields: [
      {
        name: 'image',
        title: 'Cover image',
        type: 'image',
        options: {hotspot: true},
        validation: (rule: {required: () => unknown}) => rule.required(),
      },
    ],
  },
  // The in-context host: a real book document whose hotspot-enabled cover image sits
  // beside a plain Title, so the image field reads as one field of a document being edited.
  {
    name: 'bookCoverDoc',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'cover', title: 'Cover image', type: 'image', options: {hotspot: true}},
    ],
  },
]

/** Seeds the preview store so the bound-asset story resolves its `sanity.imageAsset`. */
const previewStore = createMockDocumentPreviewStore({documents: imageAssetFixtures})

function ImageDemo(props: {documentType?: string; value?: Record<string, unknown>}) {
  const {documentType = 'imageDoc', value} = props
  // Unique per mounted instance so the autodocs page (every story at once) does not emit
  // multiple form roots sharing id="root" and duplicate field ids.
  const id = `fb-image-${useId().replace(/:/g, '')}`
  return (
    <WithAssetLimitUpsell>
      <div style={{maxWidth: 640}}>
        <FormBuilderHarness
          documentType={documentType}
          initialDocument={value ? {image: value} : undefined}
          id={id}
          height="auto"
        />
      </div>
    </WithAssetLimitUpsell>
  )
}

const meta: Meta = {
  title: 'Forms & Input/ImageInput',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The bound-image preview pixels do not render here: reaching a real CDN is the one ' +
            'thing offline stories cannot do, so the loading state stays up while the menu, ratio ' +
            'box and hotspot affordance work live around it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | resolved via the real input resolver (`studio/inputResolver/defaultInputs.ts`): `image` → `StudioImageInput` → `BaseImageInput` |',
          '| Tier | CORE-adjacent. The image field is engine-rendered form machinery (the FormBuilder resolves and tones it like any input), but it carries two distinct things underneath: an asset service seam (upload/browse/library, shared with `FileInput`) and a proprietary hotspot/crop editor that no design system ships. Carbon Studio filed "image input + hotspot" as a 🔴 Gap, built on tokens because there was no equivalent to reuse |',
          '| Audit | 🔴 needs-work (`asset-lifecycle-reuse`). As with files, the asset is authored as an in-document attachment rather than a library-first item; the hotspot/crop surface itself holds (see the ImageTool stories, which render it with real pixels) |',
          '| Patterns | `asset-lifecycle-reuse` |',
          '',
          'The field for putting an image on a document, upload or browse, then crop and set a ' +
            'focal point, storing a reference to the managed image asset. This is where cover ' +
            'images, avatars and hero art get onto a document. On the surface it is the file ' +
            "field's sibling, the same upload/browse/library seam over an asset service, but it " +
            'carries something no design system ships: a hotspot and crop editor that lets an ' +
            'author pin a focal point once and have every aspect ratio reframe around it.',
          '',
          'These stories mount the real `ImageInput` through a live `FormBuilder` ' +
            '(`lib/formBuilderHarness.tsx`): asset sources come from `useSource().form.image`, ' +
            'and the bound-asset menu resolves its `sanity.imageAsset` through the fixture-backed ' +
            '`DocumentPreviewStore`.',
          '',
          'Mocking boundary (read honestly): the empty, invalid, upload, read-only and error ' +
            'states render fully from the real component. The bound-image preview pixels do not: ' +
            '`ImageInput` builds a `cdn.sanity.io` URL from the asset ref via `@sanity/image-url`, ' +
            'which cannot resolve offline, so the preview area holds its loading state while the ' +
            'actions menu, ratio box and hotspot affordance render live. Real hotspot/crop pixels ' +
            'are in the dedicated `ImageTool` stories, which load a self-contained data-URI image.',
          '',
          '> **Why it matters:** the bound-image preview pixels do not render here. `ImageInput` ' +
            'builds a CDN URL that cannot resolve offline, so the preview holds its loading state ' +
            'while the menu, ratio box and hotspot affordance render live. For the crop/hotspot ' +
            'surface with real pixels, see the ImageTool stories.',
          '',
          'The page closes in context: the image field as the Cover image of the "Anna Karenina" ' +
            'book, beside its Title (bound asset, menu and ratio box live, preview pixels held ' +
            'offline).',
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
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * Empty: the upload placeholder in its drop-target card, prompt text, Upload button, and
 * (with selectable sources) a Browse affordance. Pre-upload state only; the drop/upload
 * round-trip needs a backend the mock does not provide.
 */
export const Empty: Story = {
  render: () => <ImageDemo />,
}

/**
 * A bound image asset. The asset **menu** (change / hotspot-crop / clear) and the ratio
 * box render live from the resolved `sanity.imageAsset`, but the preview **pixels** show
 * the loading state, the `cdn.sanity.io` URL built from the ref has no backend offline
 * (see the component docblock). For the image editing surface with real pixels, see
 * `Forms & Input/ImageTool`.
 */
export const WithImage: Story = {
  name: 'With image (bound asset, menu live, pixels narrated)',
  render: () => <ImageDemo value={boundImageValue} />,
}

/**
 * Mid-upload: `_upload` on the value drives the real `UploadProgress` bar. Fixture-driven,
 * so no network, exactly what an in-flight image upload renders.
 */
export const Uploading: Story = {
  name: 'Uploading (progress state)',
  render: () => <ImageDemo value={uploadingImageValue} />,
}

/**
 * The value’s `asset` reference is not a valid image source: the input shows
 * `InvalidImageWarning` with a clear-value action rather than attempting a preview, the
 * real corrupt-value guard, offline.
 */
export const InvalidImage: Story = {
  name: 'Invalid image reference',
  render: () => <ImageDemo value={invalidImageValue} />,
}

/**
 * Read-only (from the schema): the drop-target is inert and mutating actions are disabled.
 */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => <ImageDemo documentType="imageReadOnlyDoc" value={boundImageValue} />,
}

/**
 * A `required()` image with no asset: `validateDocument` runs for real in the harness and
 * tones the empty field with its validation marker.
 */
export const ErrorRequired: Story = {
  name: 'Error (required, empty)',
  render: () => <ImageDemo documentType="imageRequiredDoc" />,
}

/**
 * **Recommended.** `asset-lifecycle-reuse`: the bound image reframed as a library-first
 * item, its identity, alt text, and where-used shown on the field so it reads as a
 * managed asset, not an attachment. Prop-driven illustration; the underlying value is the
 * same asset reference the real input emits.
 */
export const RecommendedLibraryFirst: Story = {
  name: 'Recommended (library-first identity)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <div style={{maxWidth: 640}}>
      <Card border radius={2} padding={3} tone="primary">
        <Text size={1}>
          coastline.jpg · 2000×3000 · in library · used in 3 documents · alt text and hotspot
          managed on the asset, so reuse and cropping carry across every document that references
          it.
        </Text>
      </Card>
    </div>
  ),
}

/**
 * In context: the image field as the Cover image of the "Anna Karenina" book, sitting
 * beside the document's Title. A live `FormBuilder` over a real document with a bound
 * `sanity.imageAsset`, the asset menu, ratio box and hotspot affordance resolve live;
 * the preview pixels hold their loading state, since the `cdn.sanity.io` URL cannot
 * resolve offline (real pixels live in the `ImageTool` stories). This is the everyday
 * moment of putting cover art on a document.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <WithAssetLimitUpsell>
      <div style={{maxWidth: 640}}>
        <FormBuilderHarness
          id="fb-image-in-context"
          documentType="bookCoverDoc"
          initialDocument={{title: 'Anna Karenina', cover: boundImageValue}}
          height="auto"
        />
      </div>
    </WithAssetLimitUpsell>
  ),
}
