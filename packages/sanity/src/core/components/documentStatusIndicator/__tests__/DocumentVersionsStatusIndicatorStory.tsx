import {type DocumentSystem} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {DocumentVersionsStatusIndicator} from '../DocumentVersionsStatusIndicator'

const PUBLISHED_ID = 'article-1'
const groupRef = {_ref: PUBLISHED_ID, _weak: true} as const

function versionStub(id: string, system: Omit<DocumentSystem, 'group'>): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: '',
    _createdAt: '',
    _updatedAt: '',
    _type: 'article',
    _system: {group: groupRef, ...system},
  }
}

const published = versionStub(PUBLISHED_ID, {})
const draft = versionStub('drafts.article-1', {bundleId: 'drafts'})

function StatusRow({
  label,
  documentVersions,
}: {
  label: string
  documentVersions: VersionInfoDocumentStub[]
}) {
  return (
    <Flex alignItems="center" gap={4} justifyContent="space-between">
      <Text size={1}>{label}</Text>
      <DocumentVersionsStatusIndicator documentVersions={documentVersions} />
    </Flex>
  )
}

/**
 * Chromatic sentinel for list-row publish-state icons. Pins the caution ring
 * on a draft that has never been published, the positive disc on a published
 * document, and both when a published document also has draft edits.
 */
export function DocumentVersionsStatusIndicatorStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={4}>
          <StatusRow documentVersions={[draft]} label="draft only" />
          <StatusRow documentVersions={[published]} label="published only" />
          <StatusRow documentVersions={[published, draft]} label="published and draft" />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
