import {diffInput, wrap} from '@sanity/diff'
import {DocumentIcon} from '@sanity/icons/Document'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {MissingSinceDocumentError} from '../../../../store/events/getDocumentChanges'
import {type Annotation, type StringDiff} from '../../../types'
import {ChangeBreadcrumb} from '../ChangeBreadcrumb'
import {ChangesError} from '../ChangesError'
import {DiffErrorBoundary} from '../DiffErrorBoundary'
import {DiffString} from '../DiffString'
import {MetaInfo} from '../MetaInfo'
import {NoChanges} from '../NoChanges'
import {ValueError} from '../ValueError'

const TYPE_ERROR = {
  messageKey: 'changes.error.incorrect-type-message' as const,
  expectedType: 'string',
  actualType: 'number',
  value: 42,
}

// A fixed past timestamp so the annotation color is deterministic and no
// relative-time text can drift.
const ANNOTATION: Annotation = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

// Removed, unchanged and added segments in one string.
const STRING_DIFF = diffInput(
  wrap('The quick brown fox', ANNOTATION),
  wrap('The quick red fox jumps', ANNOTATION),
) as StringDiff

function ThrowingDiff(): never {
  throw new Error('Diff component fixture failure')
}

// DiffErrorBoundary takes `t` as a prop (it is a class component), so the
// translation hook has to live in a wrapper.
function DiffErrorBoundaryExample() {
  const {t} = useTranslation()
  return (
    <DiffErrorBoundary t={t}>
      <ThrowingDiff />
    </DiffErrorBoundary>
  )
}

/**
 * Chromatic sentinel for review-changes chrome migrated to ui5 Box: critical
 * ValueError, caution ChangesError, MetaInfo padding, ChangeBreadcrumb title
 * segments, the DiffErrorBoundary fallback, inline DiffString segments and the
 * NoChanges empty state. Shared with Storybook via a thin CSF wrapper.
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
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              diff error boundary
            </Text>
            <DiffErrorBoundaryExample />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              diff string
            </Text>
            <div>
              <DiffString diff={STRING_DIFF} />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              no changes
            </Text>
            <NoChanges />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
