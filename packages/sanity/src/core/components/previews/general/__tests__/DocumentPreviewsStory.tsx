import {DocumentIcon} from '@sanity/icons/Document'
import {EditIcon} from '@sanity/icons/Edit'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CompactPreview} from '../CompactPreview'
import {DefaultPreview} from '../DefaultPreview'
import {DetailPreview} from '../DetailPreview'

const STATUS = <Text size={0}>Draft</Text>

/**
 * Chromatic sentinel for ui5 Box padding on the three general preview
 * layouts (media vs no-media changes paddingLeft). Filled states only —
 * placeholders use animated skeletons. Shared with the co-located CSF file.
 */
export function DocumentPreviewsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              default / title only
            </Text>
            <DefaultPreview title="Summer launch" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              default / media subtitle status
            </Text>
            <DefaultPreview
              media={<DocumentIcon />}
              status={STATUS}
              subtitle="Article"
              title="Summer launch"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              default / fallback title
            </Text>
            <DefaultPreview media={<DocumentIcon />} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              compact / media
            </Text>
            <CompactPreview media={<DocumentIcon />} status={<EditIcon />} title="Summer launch" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              compact / no media
            </Text>
            <CompactPreview title="Summer launch" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              detail
            </Text>
            <DetailPreview
              description="Hero story for the campaign landing page."
              media={<DocumentIcon />}
              renderDefault={() => <span />}
              status={STATUS}
              subtitle="Article"
              title="Summer launch"
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
