import {DocumentIcon} from '@sanity/icons/Document'
import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {MediaPreview} from '../MediaPreview'

const SCHEMA_TYPES: [] = []

/**
 * Chromatic sentinel for MediaPreview ui5 Box padding around the square
 * media tile. Filled states only — the placeholder uses an animated
 * skeleton, and progress overlays CircularProgress. Title + subtitle
 * enable the tooltip; it stays closed so the snapshot is the tile.
 */
export function MediaPreviewStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Flex gap={5}>
          <VStack gap={2} style={{width: 160}}>
            <Text muted size={1} weight="medium">
              media only
            </Text>
            <MediaPreview media={<DocumentIcon />} />
          </VStack>
          <VStack gap={2} style={{width: 160}}>
            <Text muted size={1} weight="medium">
              title and subtitle
            </Text>
            <MediaPreview media={<DocumentIcon />} subtitle="Article" title="Summer launch" />
          </VStack>
          <VStack gap={2} style={{width: 160}}>
            <Text muted size={1} weight="medium">
              no radius
            </Text>
            <MediaPreview media={<DocumentIcon />} withRadius={false} />
          </VStack>
        </Flex>
      </Card>
    </TestWrapper>
  )
}
