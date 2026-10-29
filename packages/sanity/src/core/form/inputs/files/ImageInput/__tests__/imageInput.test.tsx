/**
 * ImageInput-specific tests.
 * Asset source behavior is covered in assetSourceIntegration.test.tsx.
 * Drag-to-upload is covered in common/__tests__/uploadTarget.test.tsx.
 */
import {createImageUrlBuilder} from '@sanity/image-url'
import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceComponentProps,
  type AssetSourceUploadFile,
  type ImageOptions,
  type SchemaType,
} from '@sanity/types'
import {screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {useEffect} from 'react'
import {of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {
  createMockAssetSourceWithMediaLibraryUploader,
  observeImageAssetStub,
} from '../../../../../../../test/fixtures/assetSourceMocks'
import {renderImageInput} from '../../../../../../../test/form/renderImageInput'
import {set} from '../../../../patch/patch'
import {PatchEvent} from '../../../../patch/PatchEvent'
import {type FormPatch} from '../../../../patch/types'
import {PickerModeUploader} from '../../../../studio/federatedAssetSource/uploader'
import {createUploadEvent} from '../../../../studio/uploads/utils'
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
    expect(flexContainer).toHaveClass('sui-justify-content-flex-end')
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

describe('ImageInput default crop', () => {
  const WIDE_REF = 'image-26db46ec62059d6cd491b4343afaecc92ff1b4d5-2000x1000-jpg'
  const SQUARE_REF = 'image-26db46ec62059d6cd491b4343afaecc92ff1b4d5-1000x1000-jpg'
  const CENTERED_SQUARE_CROP = {
    _type: 'sanity.imageCrop',
    top: 0,
    bottom: 0,
    left: 0.25,
    right: 0.25,
  }

  function assetPatch(ref: string) {
    return set({_type: 'reference', _ref: ref}, ['asset'])
  }

  // An asset source plugin whose uploader patches the asset itself, like the dataset source.
  function createPatchingUploader(ref: string) {
    return class PatchingUploader extends PickerModeUploader {
      upload(
        files: File[],
        options?: {schemaType?: SchemaType; onChange?: (patch: unknown) => void},
      ): AssetSourceUploadFile[] {
        const uploadFiles = super.upload(files)
        options?.onChange?.([assetPatch(ref)])
        uploadFiles.forEach((file) => this.updateFile(file.id, {status: 'complete'}))
        return uploadFiles
      }
    }
  }

  const GIF_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

  function createFileSelectingAssetSource(): AssetSource {
    function SelectFileComponent(props: AssetSourceComponentProps) {
      const {action, onSelect} = props
      useEffect(() => {
        if (action === 'select') {
          const selection: AssetFromSource[] = [{kind: 'base64', value: GIF_DATA_URL}]
          onSelect(selection)
        }
      }, [action, onSelect])
      return null
    }
    return {name: 'file-source', component: SelectFileComponent}
  }

  function resolveUploaderFor(ref: string) {
    return () => ({
      priority: 1,
      type: 'image',
      accepts: 'image/*',
      upload: () => of(createUploadEvent([assetPatch(ref)])),
    })
  }

  function changePatches(onChange: {mock: {calls: unknown[][]}}): FormPatch[][] {
    return onChange.mock.calls.map(
      ([patch]) => PatchEvent.from(patch as FormPatch | FormPatch[] | PatchEvent).patches,
    )
  }

  function cropAfterAsset(onChange: {mock: {calls: unknown[][]}}) {
    const change = changePatches(onChange).find((patches) =>
      patches.some((patch) => patch.path.join('.') === 'asset' && patch.type === 'set'),
    )
    const assetIndex = change?.findIndex((patch) => patch.path.join('.') === 'asset') ?? -1
    return change?.slice(assetIndex + 1).find((patch) => patch.path.join('.') === 'crop')
  }

  function renderWithOptions(
    options: ImageOptions,
    sources: {
      assetSources: AssetSource[]
      resolveUploader?: ReturnType<typeof resolveUploaderFor>
      value?: Record<string, unknown>
    },
  ) {
    const {value} = sources
    return renderImageInput({
      assetSources: sources.assetSources,
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'mainImage', title: 'Main image', type: 'image', options},
      imageUrlBuilder: value
        ? createImageUrlBuilder({projectId: 'test', dataset: 'test'})
        : undefined,
      observeAsset: observeImageAssetStub,
      props: value ? {documentValue: {mainImage: value}} : undefined,
      resolveUploader: sources.resolveUploader,
      render: (inputProps) => <BaseImageInput {...inputProps} value={value} />,
    })
  }

  it('crops an existing off-ratio asset in the change that selects it', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader({browseAssetId: WIDE_REF})
    const {onChange} = await renderWithOptions({aspectRatio: 1}, {assetSources: [assetSource]})

    await userEvent.click(screen.getByTestId(imageBrowseTestId(assetSource.name)))

    await waitFor(() => {
      expect(cropAfterAsset(onChange)).toMatchObject({type: 'set', value: CENTERED_SQUARE_CROP})
    })
  })

  it('clears the crop for a selected asset that already fits', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader({browseAssetId: SQUARE_REF})
    const {onChange} = await renderWithOptions({aspectRatio: 1}, {assetSources: [assetSource]})

    await userEvent.click(screen.getByTestId(imageBrowseTestId(assetSource.name)))

    await waitFor(() => {
      expect(cropAfterAsset(onChange)).toMatchObject({type: 'unset'})
    })
  })

  it('clears a stale crop when its asset source uploader replaces the asset with one that fits', async () => {
    const value = {
      _type: 'image',
      asset: {_type: 'reference', _ref: WIDE_REF},
      crop: CENTERED_SQUARE_CROP,
    }
    const assetSource: AssetSource = {
      ...createMockAssetSourceWithMediaLibraryUploader({name: 'patching-source'}),
      Uploader: createPatchingUploader(SQUARE_REF),
    }
    const {onChange} = await renderWithOptions(
      {aspectRatio: 1},
      {assetSources: [assetSource], value},
    )

    await userEvent.click(screen.getByTestId('options-menu-button'))
    const [uploadButton] = await screen.findAllByTestId('file-input-upload-button')
    await userEvent.click(uploadButton, {pointerEventsCheck: 0})
    await userEvent.upload(
      await screen.findByTestId('open-file-picker-input'),
      new File(['content'], 'square.jpg', {type: 'image/jpeg'}),
    )

    await waitFor(() => {
      expect(cropAfterAsset(onChange)).toMatchObject({type: 'unset'})
    })
  })

  it('writes no crop without an aspect ratio', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader({browseAssetId: WIDE_REF})
    const {onChange} = await renderWithOptions({hotspot: true}, {assetSources: [assetSource]})

    await userEvent.click(screen.getByTestId(imageBrowseTestId(assetSource.name)))

    await waitFor(() => {
      expect(changePatches(onChange).length).toBeGreaterThan(0)
    })
    expect(cropAfterAsset(onChange)).toBeUndefined()
  })

  it('crops an off-ratio upload in the change its asset source uploader makes', async () => {
    const assetSource: AssetSource = {
      ...createMockAssetSourceWithMediaLibraryUploader({name: 'patching-source'}),
      Uploader: createPatchingUploader(WIDE_REF),
    }
    const {onChange} = await renderWithOptions({aspectRatio: 1}, {assetSources: [assetSource]})

    const uploadButton = screen.getByTestId('file-input-upload-button-patching-source')
    const fileInput = uploadButton.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, new File(['content'], 'wide.jpg', {type: 'image/jpeg'}))

    await waitFor(() => {
      expect(cropAfterAsset(onChange)).toMatchObject({type: 'set', value: CENTERED_SQUARE_CROP})
    })
  })

  it('crops an off-ratio image an asset source hands over for upload once the upload completes', async () => {
    const {onChange} = await renderWithOptions(
      {aspectRatio: 1},
      {
        assetSources: [createFileSelectingAssetSource()],
        resolveUploader: resolveUploaderFor(WIDE_REF),
      },
    )

    await userEvent.click(screen.getByTestId(imageBrowseTestId('file-source')))

    await waitFor(() => {
      const lastChange = changePatches(onChange).at(-1) ?? []
      expect(lastChange.map((patch) => `${patch.type} ${patch.path.join('.')}`)).toEqual([
        'unset hotspot',
        'unset crop',
        'unset media',
        'set crop',
      ])
      expect(lastChange.at(-1)).toMatchObject({value: CENTERED_SQUARE_CROP})
    })
  })
})
