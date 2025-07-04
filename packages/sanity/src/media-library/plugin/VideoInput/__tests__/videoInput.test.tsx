import {type VideoAsset, type VideoSchemaType} from '@sanity/types'
import {fireEvent, waitFor} from '@testing-library/react'
import {type Observable, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {renderVideoInput} from '../../../../../test/form/renderVideoInput'
import {sourceName} from '../../asset-source/createAssetSource'
import {BaseVideoInput} from '../VideoInput'

const ASSET_SOURCE_NAME = sourceName

const observeAssetStub = (): Observable<VideoAsset> =>
  of({
    originalFilename: 'cats.mp4',
    url: 'https://cdn.sanity.io/files/ppsg7ml5/test/26db46ec62059d6cd491b4343afaecc92ff1b4d5.mp4',
    size: 31,
    _id: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-mp4',
    _rev: 'slQurnjRhOy7Fj3dkfUHei',
    _type: 'sanity.videoAsset',
  } as VideoAsset)

describe.skip('VideoInput with empty state', () => {
  it('renders an empty input as default', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} />,
    })
    expect(result.queryByTestId('file-button-input')!.getAttribute('value')).toBe('')
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button when it has at least one element in assetSources', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} />,
    })

    expect(
      result.queryByTestId(`file-input-upload-button-${ASSET_SOURCE_NAME}`),
    ).toBeInTheDocument()
    expect(
      result.queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`),
    ).toBeInTheDocument()
  })

  it('renders only the upload button when it has no assetSources', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} assetSources={[]} />,
    })
    expect(
      result.queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`),
    ).not.toBeInTheDocument()
    expect(
      result.queryByTestId(`file-input-upload-button-${ASSET_SOURCE_NAME}`),
    ).toBeInTheDocument()
    expect(
      result.queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`),
    ).not.toBeInTheDocument()
  })

  it('renders the browse button with a tooltip when it has at least one element in assetSources', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseVideoInput
          {...inputProps}
          assetSources={[{name: 'source1', Uploader: {}}, {name: 'source2'}] as any}
        />
      ),
    })

    const browseButton = result.queryByTestId('file-input-multi-browse-button')

    expect(result.queryByTestId('file-input-upload-button-source1')).toBeInTheDocument()
    expect(browseButton).toBeInTheDocument()

    fireEvent.click(browseButton!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button-source1')).toBeInTheDocument()
      expect(result.queryByTestId('file-input-browse-button-source2')).toBeInTheDocument()
    })
  })

  /* directUploads - allows for user to upload files directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} directUploads={false} />,
    })

    expect(
      result
        .queryByTestId(`file-input-upload-button-${ASSET_SOURCE_NAME}`)!
        .getAttribute('data-disabled'),
    ).toBe('true')
  })

  it('has default text that mentions that you cannot upload files when directUploads is false', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} directUploads={false} />,
    })

    expect(
      result
        .queryByTestId(`file-input-upload-button-${ASSET_SOURCE_NAME}`)!
        .getAttribute('data-disabled'),
    ).toBe('true')
  })

  /* readOnly - the file input is read only or not */

  it('the upload button is disabled when the input is readOnly', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} readOnly />,
    })

    expect(
      result
        .queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`)!
        .getAttribute('data-disabled'),
    ).toBe('true')
  })

  it('does not allow for browsing when input is readOnly', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} readOnly />,
    })

    expect(
      result
        .queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`)!
        .getAttribute('data-disabled'),
    ).toBe('true')
  })

  it('does not allow for upload when input is readOnly', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A simple video',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} readOnly />,
    })

    const input = result.queryByTestId('file-button-input')

    fireEvent.change(input!, {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.mp4', {type: 'video/mp4'})],
      },
    })

    await waitFor(() => {
      expect(result.queryByText('Read only')).toBeInTheDocument()
    })
  })

  it.todo('does not allow files to be dragged & uploaded when it is readOnly')
})

describe.skip('VideoInput with asset', () => {
  const value = {
    asset: {
      _ref: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-mp4',
      _type: 'reference',
    },
    _type: 'file',
  }

  it('renders the right url as default when it has asset', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} value={value} />,
    })

    expect(result.queryByText('cats.mp4')).toBeInTheDocument()
    expect(result.queryByText('31 Bytes')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button in the file menu when it has at least one element in assetSources', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        result.queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`),
      ).toBeInTheDocument()
    })
  })

  it('renders the upload button, but no browse item in the file menu when it has empty sources in the schema type', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseVideoInput
          {...inputProps}
          schemaType={{
            ...inputProps.schemaType,
            options: {...inputProps.schemaType.options, sources: []},
          }}
          value={value}
        />
      ),
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        result.queryByTestId(`file-input-upload-button-${ASSET_SOURCE_NAME}`),
      ).toBeInTheDocument()
      expect(
        result.queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`),
      ).not.toBeInTheDocument()
    })
  })

  it('renders the multiple browse buttons in the file menu when it has multiple assetSources', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseVideoInput
          {...inputProps}
          assetSources={[{name: 'source1'}, {name: 'source2'}] as any}
          value={value}
        />
      ),
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button-source1')).toBeInTheDocument()
      expect(result.queryByTestId('file-input-browse-button-source2')).toBeInTheDocument()
    })
  })

  /* directUploads - allows for user to upload files directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseVideoInput {...inputProps} directUploads={false} value={value} />
      ),
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        result
          .queryByTestId(`file-input-upload-button-${ASSET_SOURCE_NAME}`)
          ?.getAttribute('data-disabled'),
      ).toBe('')
    })
  })

  /* readOnly - the files input is read only or not */

  it('the upload button in the dropdown menu is disabled when the input is readOnly', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} readOnly value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        result
          .queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`)!
          .getAttribute('data-disabled'),
      ).toBe('')
    })
  })

  it('does not allow for browsing when input is readOnly', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} readOnly value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        result
          .queryByTestId(`file-input-browse-button-${ASSET_SOURCE_NAME}`)!
          .hasAttribute('data-disabled'),
      )
    })
  })

  it('does not allow for browsing with multiple sources when input is readOnly', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseVideoInput
          {...inputProps}
          assetSources={[{name: 'source1'}, {name: 'source2'}] as any}
          readOnly
          value={value}
        />
      ),
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        result.queryByTestId('file-input-browse-button-source1')!.hasAttribute('data-disabled'),
      )
      expect(
        result.queryByTestId('file-input-browse-button-source2')!.hasAttribute('data-disabled'),
      )
    })
  })

  it('does not allow for clearing the input it is readOnly', async () => {
    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} readOnly value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-clear')!.hasAttribute('data-disabled'))
    })
  })

  it.skip('does not allow for upload when input is readOnly & the image src is the same', async () => {
    const videoType = {
      description: '',
      fields: [
        {
          name: 'asset',
          type: {
            fields: [],
            jsonType: 'object',
            name: 'reference',
            title: 'Reference to file',
            to: [],
            type: {name: 'reference', type: null, jsonType: 'object', validation: []},
            validation: [],
          },
        },
      ],
      options: {
        accept: 'video/mp4',
      },
    }

    const {result} = await renderVideoInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'video',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseVideoInput
          {...inputProps}
          readOnly
          schemaType={videoType as any as VideoSchemaType}
          value={value}
        />
      ),
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    fireEvent.change(result.queryByTestId('video-button-input')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'cats.mp4', {type: 'video/mp4'})],
      },
    })

    await waitFor(() => {
      expect(result.queryByText('cats.mp4')).toBeInTheDocument()
      expect(result.queryByText('31 Bytes')).toBeInTheDocument()
    })
  })

  it.todo('does not allow files to be dragged & uploaded when it is readOnly')
})
