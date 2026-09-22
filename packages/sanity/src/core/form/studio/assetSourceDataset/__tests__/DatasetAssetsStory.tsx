import {type SanityClient} from '@sanity/client'
import {type Asset, type AssetSource} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {of} from 'rxjs'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {AssetRow} from '../file/AssetRow'
import {FileListView} from '../file/FileListView'
import {AssetDeleteDialog} from '../shared/AssetDeleteDialog'
import {SelectAssetsDialog} from '../shared/SelectAssetsDialog'

const FILE_ASSETS: Asset[] = [
  {
    _id: 'file-fixture-quarterly-report',
    _type: 'sanity.fileAsset',
    _rev: 'fixture-revision-1',
    _createdAt: '',
    _updatedAt: '',
    assetId: 'quarterly-report',
    extension: 'pdf',
    metadata: {},
    mimeType: 'application/pdf',
    originalFilename: 'quarterly-report-final-approved-version.pdf',
    path: 'files/quarterly-report.pdf',
    sha1hash: 'fixture-sha-one',
    size: 1_258_291,
    url: 'https://cdn.sanity.io/files/test/test/quarterly-report.pdf',
  },
  {
    _id: 'file-fixture-notes',
    _type: 'sanity.fileAsset',
    _rev: 'fixture-revision-2',
    _createdAt: '',
    _updatedAt: '',
    assetId: 'release-notes',
    extension: 'txt',
    metadata: {},
    mimeType: 'text/plain',
    originalFilename: 'release-notes.txt',
    path: 'files/release-notes.txt',
    sha1hash: 'fixture-sha-two',
    size: 4096,
    url: 'https://cdn.sanity.io/files/test/test/release-notes.txt',
  },
]

const mockClient = createMockSanityClient()
mockClient.observable.fetch = (query: string) =>
  of(query.includes('references(') ? [] : FILE_ASSETS)

const client = mockClient as unknown as SanityClient
const assetSource: AssetSource = {
  name: 'fixture-source',
  component: () => null,
}

function AssetStoryWrapper({children}: {children: React.ReactNode}) {
  return (
    <TestWrapper client={client} schemaTypes={[]}>
      {children}
    </TestWrapper>
  )
}

export function DatasetFileListStory() {
  return (
    <AssetStoryWrapper>
      <Card padding={4} style={{maxWidth: 900}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              file list with selected row
            </Text>
            <FileListView
              assets={FILE_ASSETS}
              onDeleteFinished={noop}
              selectedAssets={[FILE_ASSETS[0]]}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              standalone unselected row
            </Text>
            <AssetRow asset={FILE_ASSETS[1]} onDeleteFinished={noop} />
          </Stack>
        </Stack>
      </Card>
    </AssetStoryWrapper>
  )
}

export function AssetDeleteDialogStory() {
  return (
    <AssetStoryWrapper>
      <AssetDeleteDialog asset={FILE_ASSETS[0]} assetType="file" onClose={noop} onDelete={noop} />
    </AssetStoryWrapper>
  )
}

export function SelectAssetsDialogStory() {
  return (
    <AssetStoryWrapper>
      <SelectAssetsDialog
        accept="application/pdf,text/plain"
        action="select"
        assetSource={assetSource}
        assetType="file"
        onClose={noop}
        onSelect={noop}
        selectedAssets={[FILE_ASSETS[0]]}
        selectionType="single"
      />
    </AssetStoryWrapper>
  )
}
