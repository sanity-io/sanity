import {BookIcon} from '@sanity/icons/Book'
import {Card, Grid, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {BlockImagePreview} from '../../portableText/BlockImagePreview'
import {BlockPreview} from '../../portableText/BlockPreview'
import {InlinePreview} from '../../portableText/InlinePreview'
import {type GeneralPreviewLayoutKey} from '../../types'
import {CompactPreview} from '../CompactPreview'
import {DefaultPreview} from '../DefaultPreview'
import {DetailPreview} from '../DetailPreview'
import {MediaPreview} from '../MediaPreview'
import {DocumentPreviewsStory} from './DocumentPreviewsStory'

const GENERAL_LAYOUTS: GeneralPreviewLayoutKey[] = ['compact', 'default', 'media', 'detail']

const LONG_TITLE = 'The Unusually Long and Very Descriptive Title of a Document That Cannot Fit'
const LONG_SUBTITLE =
  'An equally verbose subtitle that also needs to be clipped rather than wrapped'

/** A gradient standing in for a resolved image asset, so no image URL builder or network is involved. */
function GradientMedia() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
      }}
    />
  )
}

// `DetailPreview` takes the full `PreviewProps` shape, which requires a
// `renderDefault` it never calls.
function renderNothing() {
  return <span />
}

interface SampleProps {
  title?: ReactNode
  subtitle?: ReactNode
  media?: ReactNode | typeof GradientMedia
  isPlaceholder?: boolean
}

function PreviewByLayout(props: {layout: GeneralPreviewLayoutKey} & SampleProps) {
  const {layout, ...rest} = props
  switch (layout) {
    case 'compact':
      return <CompactPreview {...rest} />
    case 'media':
      return <MediaPreview {...rest} />
    case 'detail':
      return <DetailPreview {...rest} renderDefault={renderNothing} />
    case 'default':
      return <DefaultPreview {...rest} />
    default: {
      const exhaustive: never = layout
      return exhaustive
    }
  }
}

// The `media` layout is a square tile that grows to its column; keep it at a
// thumbnail size so the grid reads as a list of rows.
function LayoutCard(props: {layout: GeneralPreviewLayoutKey; children: ReactNode}) {
  return (
    <Card border padding={1} radius={2} style={props.layout === 'media' ? {width: 160} : undefined}>
      {props.children}
    </Card>
  )
}

function LayoutLabel(props: {children: ReactNode}) {
  return (
    <Text muted size={0} style={{textTransform: 'uppercase'}} weight="semibold">
      {props.children}
    </Text>
  )
}

/**
 * The preview layouts every list row, pane header and reference card renders a
 * resolved document through. The general family has four layouts (`compact`,
 * `default`, `media`, `detail`), each accepting `title`, `subtitle`, `media`
 * and `status`, and each owning an `isPlaceholder` skeleton shaped to its
 * final geometry so content swaps in without layout shift. The portable-text
 * family (`block`, `blockImage`, `inline`) renders the same pipeline inside
 * the block editor. All are prop-driven; `TestWrapper` supplies the i18n the
 * "Untitled" fallback resolves through.
 */
const meta = {
  title: 'Studio/Document Previews',
  component: DocumentPreviewsStory,
} satisfies Meta<typeof DocumentPreviewsStory>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Reuses the in-package harness: Box padding on default / compact / detail
 * previews after the ui5 Box migration. Media vs no-media changes paddingLeft.
 */
export const States: Story = {}

/**
 * Each general layout loaded with media, and the same layout without a
 * `media` prop. Compact, default and detail collapse the media slot; the
 * `media` layout always renders its square frame, empty when there is nothing
 * to show.
 */
export const Layouts: Story = {
  render: () => (
    <TestWrapper schemaTypes={[]}>
      <Stack gap={5}>
        <Grid gap={4} gridTemplateColumns={2} style={{maxWidth: 720}}>
          {GENERAL_LAYOUTS.map((layout) => (
            <Stack gap={3} key={layout}>
              <LayoutLabel>{layout}</LayoutLabel>
              <LayoutCard layout={layout}>
                <PreviewByLayout
                  layout={layout}
                  media={GradientMedia}
                  subtitle="Realism"
                  title="Leo Tolstoy"
                />
              </LayoutCard>
            </Stack>
          ))}
        </Grid>
        <Grid gap={4} gridTemplateColumns={2} style={{maxWidth: 720}}>
          {GENERAL_LAYOUTS.map((layout) => (
            <Stack gap={3} key={layout}>
              <LayoutLabel>{layout} · no media</LayoutLabel>
              <LayoutCard layout={layout}>
                <PreviewByLayout layout={layout} subtitle="Realism" title="Leo Tolstoy" />
              </LayoutCard>
            </Stack>
          ))}
        </Grid>
      </Stack>
    </TestWrapper>
  ),
}

/**
 * The `isPlaceholder` skeleton for every general layout beside its loaded
 * twin. The skeleton occupies the same box the loaded row will.
 */
export const PlaceholderSkeletons: Story = {
  render: () => (
    <TestWrapper schemaTypes={[]}>
      <Grid gap={5} gridTemplateColumns={2} style={{maxWidth: 720}}>
        {GENERAL_LAYOUTS.map((layout) => (
          <Stack gap={3} key={layout}>
            <LayoutLabel>{layout}</LayoutLabel>
            <LayoutCard layout={layout}>
              <PreviewByLayout isPlaceholder layout={layout} media={GradientMedia} />
            </LayoutCard>
            <LayoutCard layout={layout}>
              <PreviewByLayout
                layout={layout}
                media={GradientMedia}
                subtitle="Realism"
                title="Leo Tolstoy"
              />
            </LayoutCard>
          </Stack>
        ))}
      </Grid>
    </TestWrapper>
  ),
}

/**
 * Long title and subtitle in a narrow column: every general layout uses
 * `textOverflow="ellipsis"`, so text truncates on one line instead of
 * wrapping and breaking the fixed row height.
 */
export const LongText: Story = {
  render: () => (
    <TestWrapper schemaTypes={[]}>
      <Stack gap={4} style={{maxWidth: 280}}>
        {GENERAL_LAYOUTS.map((layout) => (
          <LayoutCard key={layout} layout={layout}>
            <PreviewByLayout
              layout={layout}
              media={GradientMedia}
              subtitle={LONG_SUBTITLE}
              title={LONG_TITLE}
            />
          </LayoutCard>
        ))}
      </Stack>
    </TestWrapper>
  ),
}

/**
 * The portable-text family as it renders inside the block editor: a block
 * object, a block image, and an inline object flowing with surrounding text.
 */
export const PortableText: Story = {
  render: () => (
    <TestWrapper schemaTypes={[]}>
      <Stack gap={5} style={{maxWidth: 420}}>
        <Stack gap={3}>
          <LayoutLabel>block</LayoutLabel>
          <Card border padding={2} radius={2}>
            <BlockPreview media={GradientMedia} subtitle="Leo Tolstoy" title="Anna Karenina" />
          </Card>
        </Stack>
        <Stack gap={3}>
          <LayoutLabel>blockImage</LayoutLabel>
          <Card border padding={2} radius={2}>
            <BlockImagePreview media={GradientMedia} subtitle="1600 × 900" title="Cover artwork" />
          </Card>
        </Stack>
        <Stack gap={3}>
          <LayoutLabel>inline</LayoutLabel>
          <Card border padding={3} radius={2}>
            <Text size={1}>
              A sentence with an <InlinePreview media={<BookIcon />} title="inline reference" />{' '}
              rendered mid-flow.
            </Text>
          </Card>
        </Stack>
      </Stack>
    </TestWrapper>
  ),
}
