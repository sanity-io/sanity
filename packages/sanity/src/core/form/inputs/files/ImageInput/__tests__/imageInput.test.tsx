/**
 * ImageInput-specific tests.
 * Asset source behavior is covered in assetSourceIntegration.test.tsx.
 * Drag-to-upload is covered in common/__tests__/uploadTarget.test.tsx.
 */
import {createImageUrlBuilder} from '@sanity/image-url'
import {screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {observeImageAssetStub} from '../../../../../../../test/fixtures/assetSourceMocks'
import {renderImageInput} from '../../../../../../../test/form'
import {getDataTestIdPrefix} from '../../common/AssetSourceBrowser'
import {BaseImageInput} from '../ImageInput'

const imageBrowseTestId = (sourceName: string) =>
  `${getDataTestIdPrefix({name: 'image', jsonType: 'object'})}-browse-button-${sourceName}`

describe('ImageInput with empty state', () => {
  it('renders empty input with upload and browse', async () => {
    await renderImageInput({
      assetSources: [{Uploader: {}, name: 'test-source'} as any],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'mainImage', title: 'Main image', type: 'image'},
      observeAsset: observeImageAssetStub,
      render: (inputProps) => <BaseImageInput {...inputProps} />,
    })
    expect(screen.getByTestId('file-input-upload-button-test-source')).toBeInTheDocument()
    expect(screen.getByTestId(imageBrowseTestId('test-source'))).toBeInTheDocument()
  })

  it('renders browse button right-aligned when disableNew is true', async () => {
    await renderImageInput({
      assetSources: [{Uploader: {}, name: 'test-source'} as any],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {
        name: 'mainImage',
        title: 'Main image',
        type: 'image',
        options: {disableNew: true},
      },
      observeAsset: observeImageAssetStub,
      render: (inputProps) => <BaseImageInput {...inputProps} />,
    })
    // Browse button should still be present
    expect(screen.getByTestId(imageBrowseTestId('test-source'))).toBeInTheDocument()
    // Upload button should NOT be present
    expect(screen.queryByTestId('file-input-upload-button-test-source')).not.toBeInTheDocument()
    // The browse button's parent flex container should have justify-content: flex-end
    const browseButton = screen.getByTestId(imageBrowseTestId('test-source'))
    const flexContainer = browseButton.closest('[data-ui="Flex"]')
    expect(flexContainer).toBeInTheDocument()
    expect(flexContainer).toHaveStyle('justify-content: flex-end')
  })

  it('shows invalid image warning when asset ref is not a valid image source', async () => {
    const invalidValue = {
      _type: 'image',
      asset: {_ref: 'document-invalid-or-deleted', _type: 'reference'},
    }
    await renderImageInput({
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'mainImage', title: 'Main image', type: 'image'},
      observeAsset: observeImageAssetStub,
      props: {documentValue: {mainImage: invalidValue}},
      render: (inputProps) => <BaseImageInput {...inputProps} value={invalidValue} />,
    })
    expect(screen.getByTestId('invalid-image-warning')).toBeInTheDocument()
  })
})

describe('ImageInput with asset', () => {
  const value = {
    asset: {
      _ref: 'image-26db46ec62059d6cd491b4343afaecc92ff1b4d5-100x100-jpg',
      _type: 'reference',
    },
    _type: 'image',
  }

  it('does not show upload in context menu when disableNew is true', async () => {
    await renderImageInput({
      assetSources: [{Uploader: {}, name: 'test-source'} as any],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {
        name: 'mainImage',
        title: 'Main image',
        type: 'image',
        options: {disableNew: true},
      },
      imageUrlBuilder: createImageUrlBuilder({projectId: 'test', dataset: 'test'}),
      observeAsset: observeImageAssetStub,
      render: (inputProps) => <BaseImageInput {...inputProps} value={value} />,
    })

    await userEvent.click(screen.getByTestId('options-menu-button'))

    await waitFor(() => {
      expect(screen.queryByTestId('file-input-upload-button')).not.toBeInTheDocument()
    })
  })
})
