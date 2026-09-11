import {DocumentIcon} from '@sanity/icons/Document'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {MissingSinceDocumentError} from '../../../../store/events/getDocumentChanges'
import {ChangeBreadcrumb} from '../ChangeBreadcrumb'
import {ChangesError} from '../ChangesError'
import {MetaInfo} from '../MetaInfo'
import {ValueError} from '../ValueError'

const TYPE_ERROR = {
  messageKey: 'changes.error.incorrect-type-message' as const,
  expectedType: 'string',
  actualType: 'number',
  value: 42,
}

/**
 * Chromatic sentinel for review-changes chrome migrated to ui5 Box: critical
 * ValueError, caution ChangesError, MetaInfo padding, and ChangeBreadcrumb
 * title segments. Shared with Storybook via a thin CSF wrapper.
 */
export function FieldDiffChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              value error
            </Text>
            <ValueError error={TYPE_ERROR} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              changes error
            </Text>
            <ChangesError />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              missing revision
            </Text>
            <ChangesError error={new MissingSinceDocumentError('revAbc123')} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              meta info
            </Text>
            <MetaInfo icon={DocumentIcon} title="report.pdf">
              24 kB
            </MetaInfo>
            <MetaInfo icon={DocumentIcon} markRemoved title="old-report.pdf">
              12 kB
            </MetaInfo>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              change breadcrumb
            </Text>
            <ChangeBreadcrumb titlePath={['Article', 'Body', 'Image']} />
            <ChangeBreadcrumb
              titlePath={['Article', 'Body', 'Content', 'Block', 'Image', 'Alt text']}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
