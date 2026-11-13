import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ImageAttachment} from '../ImageAttachment'

const ATTACHED_FILE = new File(['fixture'], 'screenshot.png', {type: 'image/png'})

/**
 * Chromatic sentinel for the feedback image-attachment row after the ui5
 * Flex/Text/VStack migration. Collapsed / drop-zone / drag-over / error /
 * attached-file pair Card tones with Flex alignment — a mix TypeScript
 * will not catch. The attached path shows only the filename (no thumbnail
 * URL). Copy falls back to the baked-in English feedback strings.
 */
export function ImageAttachmentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              collapsed
            </Text>
            <ImageAttachment
              dragOver={false}
              error={null}
              imageFile={null}
              onExpand={noop}
              onFiles={noop}
              onFilesOut={noop}
              onFilesOver={noop}
              onRemove={noop}
              showAttachment={false}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              drop zone
            </Text>
            <ImageAttachment
              dragOver={false}
              error={null}
              imageFile={null}
              onExpand={noop}
              onFiles={noop}
              onFilesOut={noop}
              onFilesOver={noop}
              onRemove={noop}
              showAttachment
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              drag over
            </Text>
            <ImageAttachment
              dragOver
              error={null}
              imageFile={null}
              onExpand={noop}
              onFiles={noop}
              onFilesOut={noop}
              onFilesOver={noop}
              onRemove={noop}
              showAttachment
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              size error
            </Text>
            <ImageAttachment
              dragOver={false}
              error="Image must be under 20 MB"
              imageFile={null}
              onExpand={noop}
              onFiles={noop}
              onFilesOut={noop}
              onFilesOver={noop}
              onRemove={noop}
              showAttachment
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              attached file
            </Text>
            <ImageAttachment
              dragOver={false}
              error={null}
              imageFile={ATTACHED_FILE}
              onExpand={noop}
              onFiles={noop}
              onFilesOut={noop}
              onFilesOver={noop}
              onRemove={noop}
              showAttachment
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
