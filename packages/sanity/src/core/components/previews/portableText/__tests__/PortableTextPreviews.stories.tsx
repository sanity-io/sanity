import {ImageIcon} from '@sanity/icons/Image'
import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Box, Flex, VStack} from 'ui5'

import {BlockImagePreview} from '../BlockImagePreview'
import {BlockPreview} from '../BlockPreview'

const STATUS = <Text size={0}>Draft</Text>

// Deterministic stand-in for an image asset: an inline data URI, so no network
// and no dpr-dependent CDN URL. Rendered as `<img>` because `Media` sizes an
// `img` to fill the media card while it pins an `svg` to the icon size.
const FIXTURE_IMAGE_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">' +
    '<rect fill="#c2d6f0" width="16" height="9"/>' +
    '<circle fill="#f5c26b" cx="12" cy="3" r="1.5"/>' +
    '<path fill="#6c8fb8" d="M0 9 L5 4 L8 7 L11 5 L16 9 Z"/>' +
    '</svg>',
)}`

function FixtureImage() {
  return <img alt="" src={FIXTURE_IMAGE_SRC} />
}

/**
 * Chromatic sentinel for the two Portable Text block preview layouts: ui5
 * `Flex`/`Box` spacing in the block header (media vs no-media changes
 * paddingLeft, status and actions sit in the trailing Flex) and the stacked
 * header / media card / description of the image block. Filled states only;
 * the upload progress bar is a static value so nothing animates.
 *
 * The image block's header row has a fixed height, so a title plus subtitle
 * overflows it and the root's `overflow: hidden` clips the title's top edge.
 * That is how the studio renders it today and is part of what this pins.
 */
const meta = {
  title: 'Studio/Portable Text Previews',
  component: BlockPreview,
} satisfies Meta<typeof BlockPreview>

export default meta
type Story = StoryObj<typeof meta>

function Labelled({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      <Card border radius={2} tone="inherit">
        {children}
      </Card>
    </VStack>
  )
}

export const States: Story = {
  render: () => (
    <Card padding={4}>
      <Flex gap={5} alignItems="flex-start">
        <Box style={{width: 360}}>
          <VStack gap={5}>
            <Labelled label="block / title only">
              <BlockPreview title="Pull quote" />
            </Labelled>
            <Labelled label="block / media subtitle description status">
              <BlockPreview
                description="Quoted from the launch interview."
                media={<ImageIcon />}
                status={STATUS}
                subtitle="Quote"
                title="Pull quote"
              />
            </Labelled>
            <Labelled label="block / fallback title and upload progress">
              <BlockPreview media={<ImageIcon />} progress={64} />
            </Labelled>
          </VStack>
        </Box>
        <Box style={{width: 360}}>
          <VStack gap={5}>
            <Labelled label="block image / media only">
              <BlockImagePreview media={<FixtureImage />} />
            </Labelled>
            <Labelled label="block image / title subtitle status description">
              <BlockImagePreview
                description="Hero image for the campaign landing page."
                media={<FixtureImage />}
                status={STATUS}
                subtitle="Image"
                title="Summer launch hero"
              />
            </Labelled>
          </VStack>
        </Box>
      </Flex>
    </Card>
  ),
}
