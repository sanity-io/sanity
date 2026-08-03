import {type Image, type ImageSchemaType, type ObjectSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useId, useRef, useState} from 'react'

import {
  DEFAULT_CROP,
  DEFAULT_HOTSPOT,
} from '../../../../packages/sanity/src/core/form/inputs/files/ImageToolInput/imagetool/constants'
import {ImageTool} from '../../../../packages/sanity/src/core/form/inputs/files/ImageToolInput/imagetool/ImageTool'
import {
  type Crop,
  type Hotspot,
} from '../../../../packages/sanity/src/core/form/inputs/files/ImageToolInput/imagetool/types'
import {
  ImageToolInput,
  type ImageToolInputProps,
} from '../../../../packages/sanity/src/core/form/inputs/files/ImageToolInput/ImageToolInput'
// Real components from real paths (org contract §8): the proprietary crop/hotspot editor.
// `ImageTool` is the pure SVG editor (no providers); `ImageToolInput` is the full titled
// field with the live aspect-ratio previews.
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {BOUND_IMAGE_REF, demoImageDataUri} from '../../lib/mockAssetFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const schemaTypes = [
  {
    name: 'imageDoc',
    title: 'Document with an image',
    type: 'document',
    fields: [{name: 'image', title: 'Cover image', type: 'image', options: {hotspot: true}}],
  },
]

/* -------------------------------------------------------------------------- */
/* The pure SVG editor — controlled, no providers, real pixels                */
/* -------------------------------------------------------------------------- */

/** A framed, controlled `ImageTool`. The editor fills its parent, so the parent sizes it. */
function HotspotEditor(props: {hotspot?: Hotspot; crop?: Crop; readOnly?: boolean}) {
  const [value, setValue] = useState<{hotspot: Hotspot; crop: Crop}>({
    hotspot: props.hotspot ?? DEFAULT_HOTSPOT,
    crop: props.crop ?? DEFAULT_CROP,
  })

  // Both the live-drag `onChange` and the committed `onChangeEnd` emit `{hotspot}` or
  // `{crop}`; merge so editing one never drops the other.
  const merge = useCallback(
    (next: {hotspot: Hotspot} | {crop: Crop}) => setValue((prev) => ({...prev, ...next})),
    [],
  )

  return (
    <Stack gap={3} style={{maxWidth: 460}}>
      <Card border radius={2} __unstable_checkered style={{height: 340}}>
        <ImageTool
          value={value}
          src={demoImageDataUri}
          readOnly={Boolean(props.readOnly)}
          onChange={merge}
          onChangeEnd={merge}
        />
      </Card>
      <Card border radius={2} padding={3} tone="transparent">
        <Text size={0} muted style={{fontFamily: 'monospace', whiteSpace: 'pre-wrap'}}>
          {JSON.stringify(value, null, 2)}
        </Text>
      </Card>
    </Stack>
  )
}

/* -------------------------------------------------------------------------- */
/* The full field — ImageToolInput with the aspect-ratio previews             */
/* -------------------------------------------------------------------------- */

function applyImagePatches(
  prev: Image,
  patches: {type: string; path: (string | number)[]; value?: unknown}[],
): Image {
  const next: Record<string, unknown> = {...prev}
  for (const patch of patches) {
    const key = patch.path[0]
    if (typeof key !== 'string') continue
    if (patch.type === 'set') next[key] = patch.value
    if (patch.type === 'unset') delete next[key]
  }
  return next as Image
}

function ImageToolFieldDemo(props: {hotspot?: Hotspot; crop?: Crop; readOnly?: boolean}) {
  const schema = useSchema()
  const imageDoc = schema.get('imageDoc') as ObjectSchemaType
  const field = imageDoc.fields.find((candidate) => candidate.name === 'image')!
  const schemaType = field.type as ImageSchemaType

  const [value, setValue] = useState<Image>({
    _type: 'image',
    asset: {_type: 'reference', _ref: BOUND_IMAGE_REF},
    hotspot: {_type: 'sanity.imageHotspot', ...(props.hotspot ?? DEFAULT_HOTSPOT)},
    crop: {_type: 'sanity.imageCrop', ...(props.crop ?? DEFAULT_CROP)},
  } as Image)

  const [focusPath, setFocusPath] = useState<(string | number)[]>([])
  const ref = useRef<HTMLElement | null>(null)
  const inputId = `storybook-imagetool-${useId().replace(/:/g, '')}`

  const onChange = useCallback((change: unknown) => {
    const patches = (Array.isArray(change) ? change : [change]) as Parameters<
      typeof applyImagePatches
    >[1]
    setValue((prev) => applyImagePatches(prev, patches))
  }, [])

  const inputProps = {
    imageUrl: demoImageDataUri,
    schemaType,
    value,
    changed: false,
    level: 0,
    path: ['image'],
    focusPath,
    presence: [],
    validation: [],
    readOnly: props.readOnly,
    id: inputId,
    onChange,
    onPathFocus: setFocusPath,
    elementProps: {
      id: inputId,
      onFocus: () => setFocusPath(['hotspot']),
      onBlur: () => undefined,
      ref,
    },
  } as unknown as ImageToolInputProps

  return (
    <div style={{maxWidth: 520}}>
      <ImageToolInput {...inputProps} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const meta: Meta = {
  title: 'Forms & Input/ImageTool',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'An author drops a focal point on an image and pulls in a crop, and from that single ' +
            'act every size the front end asks for reframes around the point that matters instead ' +
            'of blindly centre-cropping.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/files/ImageToolInput/` (`imagetool` for the pure SVG editor, `ImageToolInput.tsx` for the full field) |',
          '| Tier | CORE-adjacent. The crop + hotspot editor is Studio\'s proprietary invention: no design system ships a coordinate editor that lets an author pin a focal point and an inset crop and previews the result across arbitrary aspect ratios. Carbon Studio filed it as a 🔴 Gap, "built" on tokens because there was nothing to reuse |',
          '| Audit | 🟢 holds. This is a differentiation surface, not one of the 75 needs-work defects; it is exactly the kind of component a commodity design system cannot teach, so a real-code catalog most needs it documented |',
          '| Patterns | `asset-lifecycle-reuse` |',
          '',
          "Studio's crop-and-hotspot editor: drag a focal point onto an image and inset a crop, " +
            'and every aspect ratio reframes around it. This is one of the most distinctive ' +
            'things Studio builds, and one of the most satisfying to demo. From a single pinned ' +
            'point, every size the front end asks for, a square thumbnail, a 16:9 hero, a tall ' +
            'portrait, reframes around the point that matters instead of blindly centre-cropping. ' +
            'No commodity design system ships a coordinate editor like this. Carbon Studio filed ' +
            'it as a Gap built from tokens.',
          '',
          'Unlike the `ImageInput` preview (which needs the CDN), these stories load a ' +
            'self-contained SVG data-URI (`lib/mockAssetFixtures.ts`), so the editor and its ' +
            'aspect-ratio previews render with real pixels, fully offline. `ImageTool` takes a ' +
            'plain `src` and mounts with zero providers; `ImageToolInput` is the full titled ' +
            'field (checkered canvas plus the 3:4 / Square / 16:9 / Panorama previews that ' +
            'recompute live as you drag the hotspot).',
          '',
          'Interactions are real: drag the round hotspot to move the focal point, drag the crop ' +
            'handles to inset the frame. The JSON below the pure editor updates from the ' +
            "component's own `onChange`/`onChangeEnd`, and the field's previews reframe from the " +
            'same `HotspotImage` pipeline Studio ships.',
          '',
          '> **Why it matters:** `ImageTool` is the pure SVG editor and mounts with zero ' +
            'providers, a plain source and a value is all it needs. `ImageToolInput` is the full ' +
            'titled field that adds the live aspect-ratio previews. Reach for the former when the ' +
            'editing surface alone is enough, the latter to show why the hotspot matters.',
          '',
          'The page closes in context: the full `ImageToolInput` field as the Cover image of ' +
            'the "Anna Karenina" book, focal point and crop set the way an editor would.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
    }),
  ],
  tags: ['autodocs', 'chapter:cms', 'pattern:asset-lifecycle-reuse', 'audit:holds', 'tier:core'],
}

export default meta
type Story = StoryObj

/**
 * The pure `ImageTool` at defaults, centered hotspot, no crop inset, over a real
 * (data-URI) image. Drag the hotspot and the crop handles; the emitted value is shown
 * below. This is the irreducible proprietary editing surface, mounted with no providers.
 */
export const Editor: Story = {
  render: () => <HotspotEditor />,
}

/**
 * A saved, off-center hotspot with an inset crop, the state the editor persists to the
 * document’s `hotspot`/`crop` fields. Shows the editor reflecting an existing value rather
 * than defaults.
 */
export const PreconfiguredHotspot: Story = {
  name: 'Preconfigured hotspot + crop',
  render: () => (
    <HotspotEditor
      hotspot={{x: 0.36, y: 0.62, width: 0.28, height: 0.3}}
      // `top` is pushed down from 0.08 so the crop frame's top-left resize handle clears
      // the "Hotspot demo (400x300)" caption baked into the fixture image (lib/mockAssetFixtures.tsx,
      // top-left corner) instead of rendering on top of it.
      crop={{top: 0.18, bottom: 0.12, left: 0.05, right: 0.15}}
    />
  ),
}

/** Read-only: the image renders but the hotspot/crop handles do not respond to drags. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => <HotspotEditor hotspot={{x: 0.36, y: 0.62, width: 0.28, height: 0.3}} readOnly />,
}

/**
 * The full `ImageToolInput` field: the titled, checkered editing canvas plus the four
 * aspect-ratio previews (3:4, Square, 16:9, Panorama) that recompute live from the hotspot
 * and crop, the "why the hotspot matters" surface, with real pixels and no backend.
 */
export const FullField: Story = {
  name: 'Full field (with aspect-ratio previews)',
  render: () => <ImageToolFieldDemo hotspot={{x: 0.36, y: 0.62, width: 0.28, height: 0.3}} />,
}

/**
 * In context: the crop + hotspot editor as the Cover image of the "Anna Karenina" book.
 * An editor has pinned the focal point off-centre and pulled in a crop; the aspect-ratio
 * previews show how every size the front end asks for, a square thumbnail, a 16:9 hero,
 * a tall portrait, reframes around that point. Drag the hotspot and the crop handles:
 * the previews recompute live, exactly as they would on the real cover field.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <Stack gap={4} style={{maxWidth: 520}}>
      <Stack gap={2}>
        <Text size={1} muted>
          Book
        </Text>
        <Text size={2} weight="semibold">
          Anna Karenina
        </Text>
      </Stack>
      <ImageToolFieldDemo hotspot={{x: 0.36, y: 0.62, width: 0.28, height: 0.3}} />
    </Stack>
  ),
}
