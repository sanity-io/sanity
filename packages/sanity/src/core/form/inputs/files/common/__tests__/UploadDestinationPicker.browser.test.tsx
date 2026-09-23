import {type AssetSource} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createMockAssetSourceWithMediaLibraryUploader} from '../../../../../../../test/fixtures/assetSourceMocks'
import {UploadDestinationPicker} from '../UploadDestinationPicker'

const ASSET_SOURCES: AssetSource[] = [
  createMockAssetSourceWithMediaLibraryUploader({name: 'images', title: 'Image library'}),
  createMockAssetSourceWithMediaLibraryUploader({
    name: 'archive',
    title: 'Company archive',
    uploadMode: 'component',
  }),
]

function UploadDestinationPickerHarness() {
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

describe('upload destination picker', () => {
  test('renders the destination choices', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UploadDestinationPickerHarness />)

    await expect.element(page.getByText('Choose an upload destination')).toBeVisible()
    await expect.element(page.getByText('Image library')).toBeVisible()
    await expect.element(page.getByText('Company archive')).toBeVisible()
    await settleChromaticEndState()
  })
})
