import {BookIcon} from '@sanity/icons/Book'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {ImageIcon} from '@sanity/icons/Image'
import {UserIcon} from '@sanity/icons/User'
import {Box, Button, Card, Flex, Grid, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ComponentType, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'

import {LoadingBlock} from '../../../../packages/sanity/src/core/components/loadingBlock/LoadingBlock'
// Real components from real source paths (org contract §8): the general preview
// layout family — the shared surface every list row, pane header and reference card
// renders a resolved document through. Each layout owns its own loading skeleton
// (the `isPlaceholder` branch), which is exactly the fix the audit is missing.
import {CompactPreview} from '../../../../packages/sanity/src/core/components/previews/general/CompactPreview'
import {DefaultPreview} from '../../../../packages/sanity/src/core/components/previews/general/DefaultPreview'
import {DetailPreview} from '../../../../packages/sanity/src/core/components/previews/general/DetailPreview'
import {MediaPreview} from '../../../../packages/sanity/src/core/components/previews/general/MediaPreview'
// The portable-text preview family (block / blockImage / inline) — the same pipeline
// as it renders inside the block editor rather than a list.
import {BlockImagePreview} from '../../../../packages/sanity/src/core/components/previews/portableText/BlockImagePreview'
import {BlockPreview} from '../../../../packages/sanity/src/core/components/previews/portableText/BlockPreview'
import {InlinePreview} from '../../../../packages/sanity/src/core/components/previews/portableText/InlinePreview'
import {
  type GeneralPreviewLayoutKey,
  type PreviewMediaDimensions,
} from '../../../../packages/sanity/src/core/components/previews/types'
// Reuse the shared fixture universe (org contract §6) — no second mock. The layout
// components are prop-driven, so the stories borrow the fixtures' *content* rather than
// wiring the DocumentPreviewStore they never touch.
import {fixtureDocuments} from '../../lib/mockDocumentPreviewStore'

const GENERAL_LAYOUTS: GeneralPreviewLayoutKey[] = ['compact', 'default', 'media', 'detail']

/** A gradient stands in for a resolved image asset, so no client/URL builder is needed. */
function gradientMedia(
  from: string,
  to: string,
): ComponentType<{dimensions: PreviewMediaDimensions}> {
  return function GradientMedia() {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${from}, ${to})`,
        }}
      />
    )
  }
}

/** Four published authors + one book, drawn from the shared fixture universe. */
const sampleRows = (() => {
  const gradients = [
    gradientMedia('#4f46e5', '#06b6d4'),
    gradientMedia('#db2777', '#f59e0b'),
    gradientMedia('#059669', '#84cc16'),
    gradientMedia('#7c3aed', '#ec4899'),
  ]
  const authors = fixtureDocuments.filter(
    (doc) => doc._type === 'author' && !doc._id.startsWith('drafts.'),
  )
  return authors.map((doc, index) => ({
    id: doc._id,
    title: doc.name as string,
    subtitle: doc.era as string,
    media: gradients[index % gradients.length],
  }))
})()

interface SamplePreviewProps {
  title?: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  media?: ReactNode | ComponentType<{dimensions: PreviewMediaDimensions}>
  status?: ReactNode
  isPlaceholder?: boolean
}

/**
 * Renders one of the four general layouts from a single prop bag. `media` is cast at
 * this boundary exactly as the layout components cast it internally (`media as any`),
 * because the prop's `ComponentType` member is generic over the layout key. `DetailPreview`
 * alone takes the full `PreviewProps` shape, so it needs a `renderDefault` it never calls.
 */
function PreviewByLayout(props: {layout: GeneralPreviewLayoutKey} & SamplePreviewProps) {
  const {layout, media, ...rest} = props
  const shared = {...rest, media: media as never}
  switch (layout) {
    case 'compact':
      return <CompactPreview {...shared} />
    case 'media':
      return <MediaPreview {...shared} />
    case 'detail':
      return <DetailPreview {...shared} renderDefault={() => <></>} />
    default:
      return <DefaultPreview {...shared} />
  }
}

/** A single list row: a preview inside a bordered card, the way panes render list items. */
function Row(props: {children: ReactNode}) {
  return (
    <Card borderBottom padding={1}>
      {props.children}
    </Card>
  )
}

const meta: Meta = {
  title: 'Lists & Data/Previews',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'On reload the list region paints chrome over a blank white pane with no skeleton, and ' +
            'a bare spinner flashes on the dark theme, even though the fix already ships inside ' +
            'these components as a built-in skeleton mode.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/previews/`, Studio-only (no DS equivalent) |',
          "| Tier | SERVICE. The shared preview-rendering layer every list row, pane header, and reference card renders a resolved document through; maps one document to one of four general layouts (plus the portable-text family) and owns each layout's loading skeleton |",
          '| Audit | 🔴 needs-work (`skeleton-vs-spinner`, `instant-gratification`). The fix already ships inside these components as the built-in `isPlaceholder` skeleton; the Current/Recommended pair below wires it up against the real component |',
          '| Patterns | `skeleton-vs-spinner` · `instant-gratification` · `cards` |',
          '',
          "The general family has four layouts, `compact`, `default`, `media`, `detail`, each accepting `title` / `subtitle` / `media` / `status` and, when `isPlaceholder` is set, rendering a `@sanity/ui` `Skeleton`/`TextSkeleton` shaped to that layout's final geometry (so the skeleton and the loaded row occupy the same box, no layout shift). The portable-text family (`block`, `blockImage`, `inline`) renders the same pipeline inside the block editor and has no placeholder branch.",
          '',
          'Harness notes: these are pure presentational components, they take content as props and render no data of their own, so no `DocumentPreviewStore` or provider stack is needed (only the global i18n + theme decorators, for the "Untitled" fallback and theming). Sample content is borrowed from the shared fixture authors (`lib/mockDocumentPreviewStore.ts`); `media` is a gradient standing in for a resolved image asset, so no image-URL builder/client runs.',
          '',
          '> **Why it matters:** the fix needs no new component, only wiring up the skeleton mode these layouts already ship. Until then, a reload paints chrome over a blank pane and, on the dark theme, a bare spinner flashing with no shape to what is loading.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:lists',
    'chapter:data',
    'chapter:people',
    'pattern:skeleton-vs-spinner',
    'pattern:instant-gratification',
    'pattern:cards',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

const LAYOUT_ICON: Record<GeneralPreviewLayoutKey, ComponentType> = {
  compact: DocumentTextIcon,
  default: UserIcon,
  media: ImageIcon,
  detail: BookIcon,
}

/**
 * Playground: pick a layout and toggle media / placeholder. `media` here is a Sanity
 * icon element (the no-image fallback a real preview shows); switch the layout control to
 * see how the same content re-flows across the four geometries.
 */
interface PlaygroundArgs {
  layout: GeneralPreviewLayoutKey
  title: string
  subtitle: string
  withMedia: boolean
  isPlaceholder: boolean
}

export const Playground: StoryObj<Meta<PlaygroundArgs>> = {
  args: {
    layout: 'default',
    title: 'Leo Tolstoy',
    subtitle: 'Realism',
    withMedia: true,
    isPlaceholder: false,
  },
  argTypes: {
    layout: {control: 'select', options: GENERAL_LAYOUTS},
    title: {control: 'text'},
    subtitle: {control: 'text'},
    withMedia: {control: 'boolean'},
    isPlaceholder: {control: 'boolean'},
  },
  render: (args) => {
    const Icon = LAYOUT_ICON[args.layout]
    return (
      <Box padding={4} style={{maxWidth: 340}}>
        <Card border padding={1} radius={2}>
          <PreviewByLayout
            layout={args.layout}
            title={args.title}
            subtitle={args.subtitle}
            media={args.withMedia ? <Icon /> : undefined}
            isPlaceholder={args.isPlaceholder}
          />
        </Card>
      </Box>
    )
  },
}

/** The full geometry matrix: each layout, loaded, with title + subtitle + media. */
export const LayoutMatrix: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4}>
      <Grid gridTemplateColumns={[1, 1, 2]} gap={4} style={{maxWidth: 760}}>
        {GENERAL_LAYOUTS.map((layout) => (
          <Stack key={layout} gap={3}>
            <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
              {layout}
            </Text>
            <Card border padding={1} radius={2}>
              <PreviewByLayout
                layout={layout}
                title="Leo Tolstoy"
                subtitle="Realism"
                media={gradientMedia('#4f46e5', '#06b6d4')}
              />
            </Card>
          </Stack>
        ))}
      </Grid>
    </Box>
  ),
}

/**
 * The same matrix without a `media` prop. Compact / default / detail collapse the icon slot
 * and let the text column take the full width. The `media` layout, however, has **no no-media
 * fallback**: `MediaPreview` always renders its square media frame, and with `media` undefined
 * the shared `Media` helper's `renderMedia` returns `null` (`previews/_common/Media.tsx`), so
 * the frame paints as an empty bordered box rather than a placeholder icon. This is component
 * behaviour, not a story gap. The media-centric layout assumes it always has an asset; a real
 * empty-state affordance (an image/void glyph when `media` is absent) would need component work.
 */
export const WithoutMedia: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4}>
      <Grid gridTemplateColumns={[1, 1, 2]} gap={4} style={{maxWidth: 760}}>
        {GENERAL_LAYOUTS.map((layout) => (
          <Stack key={layout} gap={3}>
            <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
              {layout}
            </Text>
            <Card border padding={1} radius={2}>
              <PreviewByLayout layout={layout} title="Leo Tolstoy" subtitle="Realism" />
            </Card>
          </Stack>
        ))}
      </Grid>
    </Box>
  ),
}

/**
 * Long title and subtitle in a narrow column: every general layout uses
 * `textOverflow="ellipsis"`, so overflowing content is truncated on one line rather than
 * wrapping and breaking the fixed row height.
 */
export const LongTextTruncation: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4}>
      <Stack gap={4} style={{maxWidth: 280}}>
        {GENERAL_LAYOUTS.map((layout) => (
          <Card key={layout} border padding={1} radius={2}>
            <PreviewByLayout
              layout={layout}
              title="The Unusually Long and Very Descriptive Title of a Document That Cannot Fit"
              subtitle="An equally verbose subtitle that also needs to be clipped rather than wrapped"
              media={gradientMedia('#db2777', '#f59e0b')}
            />
          </Card>
        ))}
      </Stack>
    </Box>
  ),
}

/**
 * The `isPlaceholder` skeleton for every general layout, side by side with its loaded
 * twin. Note the skeleton occupies the same box the loaded row will: this is the
 * built-in loading state the audit found unused.
 */
export const PlaceholderSkeletons: Story = {
  name: 'Placeholder skeletons',
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4}>
      <Grid gridTemplateColumns={[1, 1, 2]} gap={5} style={{maxWidth: 760}}>
        {GENERAL_LAYOUTS.map((layout) => (
          <Stack key={layout} gap={3}>
            <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
              {layout}
            </Text>
            <Card border padding={1} radius={2}>
              <PreviewByLayout
                layout={layout}
                media={gradientMedia('#059669', '#84cc16')}
                isPlaceholder
              />
            </Card>
            <Card border padding={1} radius={2}>
              <PreviewByLayout
                layout={layout}
                title="Leo Tolstoy"
                subtitle="Realism"
                media={gradientMedia('#059669', '#84cc16')}
              />
            </Card>
          </Stack>
        ))}
      </Grid>
    </Box>
  ),
}

/** The portable-text family: how the same pipeline renders inside the block editor. */
export const PortableTextVariants: Story = {
  name: 'Portable text variants',
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4}>
      <Stack gap={5} style={{maxWidth: 420}}>
        <Stack gap={3}>
          <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
            block
          </Text>
          <Card border padding={2} radius={2}>
            <BlockPreview
              title="Anna Karenina"
              subtitle="Leo Tolstoy"
              media={gradientMedia('#7c3aed', '#ec4899') as never}
            />
          </Card>
        </Stack>

        <Stack gap={3}>
          <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
            blockImage
          </Text>
          <Card border padding={2} radius={2}>
            <BlockImagePreview
              title="Cover artwork"
              subtitle="1600 × 900"
              media={gradientMedia('#0ea5e9', '#6366f1') as never}
            />
          </Card>
        </Stack>

        <Stack gap={3}>
          <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
            inline
          </Text>
          {/*
            Baseline note (ledger candidate — component, not story): the chip rides high,
            its bottom sitting ~5px above the surrounding text bottom at 13px/19px line. The
            cause is `vertical-align: top` on the component's `RootSpan`
            (`InlinePreview.styled.tsx`), which seats the ~12px chip against the top of the
            line box rather than on the text baseline. Left unpatched here per scope; a
            `vertical-align: baseline` (or a small descender offset) in the component would
            seat it on the baseline.
          */}
          <Card border padding={3} radius={2}>
            <Text size={1}>
              A sentence with an <InlinePreview title="inline reference" media={<BookIcon />} />{' '}
              rendered mid-flow.
            </Text>
          </Card>
        </Stack>
      </Stack>
    </Box>
  ),
}

const RELOAD_MS = 1400

/** Shared reload harness for the two-variant pair below. */
function useReload() {
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Schedules the async resolve only — no synchronous setState, so it is safe to run
  // from the mount effect (which starts in the loading state already).
  const scheduleResolve = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setLoading(false), RELOAD_MS)
  }, [])

  // Button-driven: reset to loading (an event handler, never the effect) and reschedule.
  const reload = useCallback(() => {
    setLoading(true)
    scheduleResolve()
  }, [scheduleResolve])

  useEffect(() => {
    scheduleResolve()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [scheduleResolve])

  return {loading, reload}
}

function ListShell(props: {onReload: () => void; children: ReactNode}) {
  return (
    <Box padding={4} style={{maxWidth: 360}}>
      <Card border radius={2} overflow="hidden">
        <Flex
          align="center"
          justify="space-between"
          padding={2}
          style={{borderBottom: '1px solid var(--card-border-color)'}}
        >
          <Text size={1} weight="medium">
            Documents
          </Text>
          <Button fontSize={0} mode="ghost" onClick={props.onReload} padding={2} text="Reload" />
        </Flex>
        <Box style={{minHeight: 216}}>{props.children}</Box>
      </Card>
    </Box>
  )
}

/**
 * **Current (audit finding).** `skeleton-vs-spinner` / `instant-gratification`: press
 * Reload: the whole list region goes blank and a bare spinner (`LoadingBlock`) sits on
 * the empty pane until the data resolves. On the dark theme that is a spinner flashing on
 * a blank panel; the editor loses the shape of what is loading. This is the real
 * `LoadingBlock` in the real gap the previews are meant to fill.
 */
export const Current: Story = {
  name: 'Loading · Current (blank pane + spinner)',
  tags: ['audit:needs-work'],
  parameters: {controls: {include: []}},
  render: () => {
    function Demo() {
      const {loading, reload} = useReload()
      return (
        <ListShell onReload={reload}>
          {loading ? (
            <LoadingBlock fill />
          ) : (
            sampleRows.map((row) => (
              <Row key={row.id}>
                <DefaultPreview
                  title={row.title}
                  subtitle={row.subtitle}
                  media={row.media as never}
                />
              </Row>
            ))
          )}
        </ListShell>
      )
    }
    return <Demo />
  },
}

/**
 * **Recommended.** The fix needs no new component: render the list’s own previews with
 * `isPlaceholder` while data loads. Press Reload: the same rows appear immediately as
 * skeletons matching the final layout, then swap to content in place with no blank frame
 * and no reflow. `safe-exploration` of the loading state, restored with a prop the
 * component already ships.
 */
export const Recommended: Story = {
  name: 'Loading · Recommended (skeleton previews)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => {
    function Demo() {
      const {loading, reload} = useReload()
      return (
        <ListShell onReload={reload}>
          {sampleRows.map((row) => (
            <Row key={row.id}>
              <DefaultPreview
                title={loading ? undefined : row.title}
                subtitle={loading ? undefined : row.subtitle}
                media={row.media as never}
                isPlaceholder={loading}
              />
            </Row>
          ))}
        </ListShell>
      )
    }
    return <Demo />
  },
}
