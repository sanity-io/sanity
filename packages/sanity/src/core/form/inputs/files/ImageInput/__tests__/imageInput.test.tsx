/**
 * ImageInput-specific tests.
 * Asset source behavior is covered in assetSourceIntegration.test.tsx.
 * Drag-to-upload is covered in common/__tests__/uploadTarget.test.tsx.
 */
import {screen} from '@testing-library/react'
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
