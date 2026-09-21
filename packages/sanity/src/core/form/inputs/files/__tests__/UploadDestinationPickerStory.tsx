import {type AssetSource} from '@sanity/types'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {createMockAssetSourceWithMediaLibraryUploader} from '../../../../../../test/fixtures/assetSourceMocks'
import {UploadDestinationPicker} from '../common/UploadDestinationPicker'

const ASSET_SOURCES: AssetSource[] = [
  createMockAssetSourceWithMediaLibraryUploader({name: 'images', title: 'Image library'}),
  createMockAssetSourceWithMediaLibraryUploader({
    name: 'archive',
    title: 'Company archive',
    uploadMode: 'component',
  }),
]

/**
 * Chromatic sentinel for the upload destination dialog. Asset sources are
 * inert fixtures and no upload action is selected.
 */
export function UploadDestinationPickerStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <UploadDestinationPicker
        assetSources={ASSET_SOURCES}
        onClose={noop}
        onSelectAssetSource={noop}
        text="Choose an upload destination"
      />
    </TestWrapper>
  )
}
