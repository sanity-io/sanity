import {type Asset} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {AssetUsageList} from '../AssetUsageList'
import {ConfirmMessage} from '../ConfirmMessage'

function fileAsset(originalFilename?: string): Asset {
  return {
    _createdAt: '2024-01-01T00:00:00Z',
    _id: 'file-abc123',
    _rev: 'rev1',
    _type: 'sanity.fileAsset',
    _updatedAt: '2024-01-01T00:00:00Z',
    assetId: 'abc123',
    extension: 'pdf',
    mimeType: 'application/pdf',
    path: 'files/mock/test/abc123.pdf',
    sha1hash: 'abc',
    size: 1024,
    url: 'https://cdn.sanity.io/files/mock/test/abc123.pdf',
    ...(originalFilename ? {originalFilename} : {}),
  }
}

const UNNAMED_FILE = fileAsset()
const NAMED_FILE = fileAsset('report.pdf')

/**
 * Chromatic sentinel for dataset-asset delete chrome migrated to ui5 Grid /
 * Flex: ConfirmMessage default vs caution (in-use) copy for named and unnamed
 * files, plus the empty AssetUsageList header. File assets only — image
 * thumbnails would hit the network. Copy comes from the studio locale bundle
 * (no referring-document queries).
 */
export function ConfirmMessageStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unnamed file
            </Text>
            <ConfirmMessage asset={UNNAMED_FILE} assetType="file" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              named file
            </Text>
            <ConfirmMessage asset={NAMED_FILE} assetType="file" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unnamed file in use
            </Text>
            <ConfirmMessage asset={UNNAMED_FILE} assetType="file" hasResults />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              named file in use
            </Text>
            <ConfirmMessage asset={NAMED_FILE} assetType="file" hasResults />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              usage list empty named
            </Text>
            <AssetUsageList asset={NAMED_FILE} assetType="file" referringDocuments={[]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              usage list empty unnamed
            </Text>
            <AssetUsageList asset={UNNAMED_FILE} assetType="file" referringDocuments={[]} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
