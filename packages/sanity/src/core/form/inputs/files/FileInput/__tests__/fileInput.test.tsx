/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {FileAsset, FileSchemaType} from '@sanity/types'
import {fireEvent, waitFor} from '@testing-library/react'
import React from 'react'
import {Observable, of} from 'rxjs'
import {renderFileInput} from '../../../../../../../test/form'
import {BaseFileInput} from '../FileInput'

const observeAssetStub = (): Observable<FileAsset> =>
  of({
    originalFilename: 'cats.txt',
    url: 'https://cdn.sanity.io/files/ppsg7ml5/test/26db46ec62059d6cd491b4343afaecc92ff1b4d5.txt',
    size: 31,
    _id: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-txt',
    _rev: 'slQurnjRhOy7Fj3dkfUHei',
    _type: 'sanity.fileAsset',
  } as FileAsset)

describe('FileInput with empty state', () => {
  it('renders an empty input as default', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    expect(result.queryByTestId('file-button-input')!.getAttribute('value')).toBe('')
    expect(result.queryByText('Drag or paste file here')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button when it has at least one element in assetSources', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    expect(result.queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(result.queryByTestId('file-input-browse-button')).toBeInTheDocument()
  })

  it('renders only the upload button when it has no assetSources', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} assetSources={[]} />,
    })

    expect(result.queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(result.queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
  })

  it('renders the browse button with a tooltip when it has at least one element in assetSources', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseFileInput
          {...inputProps}
          assetSources={[{name: 'source1'}, {name: 'source2'}] as any}
        />
      ),
    })

    const browseButton = result.queryByTestId('file-input-multi-browse-button')

    expect(result.queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(browseButton).toBeInTheDocument()

    fireEvent.click(browseButton!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button-source1')).toBeInTheDocument()
      expect(result.queryByTestId('file-input-browse-button-source2')).toBeInTheDocument()
    })
  })

  /* directUploads - allows for user to upload files directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} directUploads={false} />,
    })

    expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
      'true',
    )
  })

  it('has default text that mentions that you cannot upload files when directUploads is false', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} directUploads={false} />,
    })

    expect(result.queryByText(`Can't upload files here`)).toBeInTheDocument()
  })

  /* readOnly - the file input is read only or not */

  it('the upload button is disabled when the input is readOnly', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} readOnly />,
    })

    expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
      'true',
    )
  })

  it('does not allow for browsing when input is readOnly', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} readOnly />,
    })

    expect(result.queryByTestId('file-input-browse-button')!.getAttribute('data-disabled')).toBe(
      'true',
    )
  })

  it('does not allow for upload when input is readOnly', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} readOnly />,
    })

    const input = result.queryByTestId('file-button-input')

    fireEvent.change(input!, {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.pdf', {type: 'file/pdf'})],
      },
    })

    await waitFor(() => {
      expect(result.queryByText(`Read only`)).toBeInTheDocument()
    })
  })

  it.todo('does not allow files to be dragged & uploaded when it is readOnly')
})

describe('FileInput with asset', () => {
  const value = {
    asset: {
      _ref: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-txt',
      _type: 'reference',
    },
    _type: 'file',
  }

  it('renders the right url as default when it has asset', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} value={value} />,
    })

    expect(result.queryByText('cats.txt')).toBeInTheDocument()
    expect(result.queryByText('31 Bytes')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button in the file menu when it has at least one element in assetSources', async () => {
    // const {queryByTestId} = render(<BaseFileInput value={value} />)
    // const {result} = render({
    //   value,
    // })
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button')).toBeInTheDocument()
    })
  })

  it('renders the browse button in the file menu when it has no assetSources', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} assetSources={[]} value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-upload-button')).toBeInTheDocument()
      expect(result.queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
    })
  })

  it('renders the multiple browse buttons in the file menu when it has multiple assetSources', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseFileInput
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
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} directUploads={false} value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
        '',
      )
    })
  })

  /* readOnly - the files input is read only or not */

  it('the upload button in the dropdown menu is disabled when the input is readOnly', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} readOnly value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
        '',
      )
    })
  })

  it('does not allow for browsing when input is readOnly', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} readOnly value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button')!.hasAttribute('data-disabled'))
    })
  })

  it('does not allow for browsing with multiple sources when input is readOnly', async () => {
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseFileInput
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
    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} readOnly value={value} />,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-clear')!.hasAttribute('data-disabled'))
    })
  })

  it.skip('does not allow for upload when input is readOnly & the image src is the same', async () => {
    const fileType = {
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
        accept: 'file/pdf',
      },
    }

    // const {result} = render({
    //   readOnly: true,
    //   schemaType: fileType as any as FileSchemaType,
    //   value,
    // })

    const {result} = await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'A simple file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => (
        <BaseFileInput
          {...inputProps}
          readOnly
          schemaType={fileType as any as FileSchemaType}
          value={value}
        />
      ),
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    fireEvent.change(result.queryByTestId('file-button-input')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.pdf', {type: 'file/pdf'})],
      },
    })

    await waitFor(() => {
      expect(result.queryByText('cats.txt')).toBeInTheDocument()
      expect(result.queryByText('31 Bytes')).toBeInTheDocument()
    })
  })

  it.todo('does not allow files to be dragged & uploaded when it is readOnly')
})
