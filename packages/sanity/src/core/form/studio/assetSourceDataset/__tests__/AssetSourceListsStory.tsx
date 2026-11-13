import {type Asset} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FileListView} from '../file/FileListView'
import {ImageListView} from '../image/ImageListView'

const NO_ASSETS: Asset[] = []

/**
 * Chromatic sentinel for dataset asset-source list chrome after the ui5 Text
 * migration. Empty lists only: FileListView pins the four-column header
 * (filename / size / type / date added) and ImageListView pins the padded
 * thumb grid with its empty muted line. Rows are omitted because AssetRow
 * formats `_createdAt` with a relative time.
 */
export function AssetSourceListsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 720}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              file list empty
            </Text>
            <FileListView assets={NO_ASSETS} onDeleteFinished={noop} selectedAssets={NO_ASSETS} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              image list empty
            </Text>
            <ImageListView
              assets={NO_ASSETS}
              onDeleteFinished={noop}
              onItemClick={noop}
              onItemKeyPress={noop}
              selectedAssets={NO_ASSETS}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
