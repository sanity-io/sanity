/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {FileAsset, FileSchemaType, SchemaType} from '@sanity/types'
import {fireEvent, waitFor} from '@testing-library/react'
import React from 'react'
import {EMPTY, Observable, of} from 'rxjs'
import {UploadOptions} from '../../../../studio/uploads/types'
import {renderInput} from '../../../../test/renderInput'
import {FIXME} from '../../../../types'
import {FileInput, FileInputProps} from '../FileInput'

const fileTestType = {
  name: 'fileTest',
  type: 'document',
  title: 'File test',
  description: 'Different test cases of file fields',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'someFile',
      title: 'A simple file',
      type: 'file',
    },
  ],
}

const observeAssetStub = (id: string): Observable<FileAsset> =>
  of({
    originalFilename: 'cats.txt',
    url: 'https://cdn.sanity.io/files/ppsg7ml5/test/26db46ec62059d6cd491b4343afaecc92ff1b4d5.txt',
    size: 31,
    _id: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-txt',
    _rev: 'slQurnjRhOy7Fj3dkfUHei',
    _type: 'sanity.fileAsset',
  } as FIXME)

const resolveUploaderStub = () => ({
  priority: 1,
  type: 'file',
  accepts: 'file/*',
  upload: (file: File, type?: SchemaType, options?: UploadOptions) => EMPTY,
})

const defaultProps: Partial<FileInputProps> = {
  assetSources: [{} as FIXME],
  compareValue: {},
  directUploads: true,
  getValuePath: () => ['file'],
  level: 1,
  observeAsset: observeAssetStub,
  resolveUploader: resolveUploaderStub,
  value: {},
}

function render(props?: Partial<FileInputProps>) {
  return renderInput<any>({
    props,
    render: (renderProps) => <FileInput {...defaultProps} {...renderProps} />,
    type: fileTestType,
  })
}

describe('FileInput with empty state', () => {
  it('renders an empty input as default', () => {
    // const {queryByTestId, queryByText} = render(<FileInput />)
    const {result} = render()

    expect(result.queryByTestId('file-button-input')!.getAttribute('value')).toBe('')
    expect(result.queryByText('Drag or paste file here')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button when it has at least one element in assetSources', () => {
    const {result} = render()

    expect(result.queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(result.queryByTestId('file-input-browse-button')).toBeInTheDocument()
  })

  it('renders only the upload button when it has no assetSources', () => {
    // const {queryByTestId} = render(<FileInput assetSources={[]} />)
    const {result} = render({
      assetSources: [],
    })

    expect(result.queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(result.queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
  })

  it('renders the browse button with a tooltip when it has at least one element in assetSources', async () => {
    // const {queryByTestId} = render(
    //   <FileInput assetSources={[{name: 'source1'}, {name: 'source2'}]} />
    // )
    const {result} = render({
      assetSources: [{name: 'source1'}, {name: 'source2'}] as FIXME,
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

  it('renders the upload button as disabled when directUploads is false', () => {
    // const {queryByTestId} = render(<FileInput directUploads={false} />)
    const {result} = render({
      directUploads: false,
    })
    expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
      'true'
    )
  })

  it('has default text that mentions that you cannot upload files when directUploads is false', () => {
    // const {queryByText} = render(<FileInput directUploads={false} />)
    const {result} = render({
      directUploads: false,
    })

    expect(result.queryByText(`Can't upload files here`)).toBeInTheDocument()
  })

  /* readOnly - the file input is read only or not */

  it('the upload button is disabled when the input is readOnly', () => {
    // const {queryByTestId} = render(<FileInput readOnly />)
    const {result} = render({readOnly: true})
    expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
      'true'
    )
  })

  it('does not allow for browsing when input is readOnly', () => {
    // const {queryByTestId} = render(<FileInput readOnly />)
    const {result} = render({
      readOnly: true,
    })

    expect(result.queryByTestId('file-input-browse-button')!.getAttribute('data-disabled')).toBe(
      'true'
    )
  })

  it('does not allow for upload when input is readOnly', async () => {
    // const {queryByTestId, queryByText} = render(<FileInput readOnly />)
    const {result} = render({
      readOnly: true,
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

  it('renders the right url as default when it has asset', () => {
    // const {queryByText} = render(<FileInput value={value} />)
    const {result} = render({
      value,
    })

    expect(result.queryByText('cats.txt')).toBeInTheDocument()
    expect(result.queryByText('31 Bytes')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button in the file menu when it has at least one element in assetSources', async () => {
    // const {queryByTestId} = render(<FileInput value={value} />)
    const {result} = render({
      value,
    })
    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button')).toBeInTheDocument()
    })
  })

  it('renders the browse button in the file menu when it has no assetSources', async () => {
    // const {queryByTestId} = render(<FileInput value={value} assetSources={[]} />)
    const {result} = render({
      assetSources: [],
      value,
    })
    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-upload-button')).toBeInTheDocument()
      expect(result.queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
    })
  })

  it('renders the multiple browse buttons in the file menu when it has multiple assetSources', async () => {
    const {result} = render({
      assetSources: [{name: 'source1'}, {name: 'source2'}] as FIXME,
      value,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button-source1')).toBeInTheDocument()
      expect(result.queryByTestId('file-input-browse-button-source2')).toBeInTheDocument()
    })
  })

  /* directUploads - allows for user to upload files directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', async () => {
    // const {queryByTestId} = render(<FileInput value={value} directUploads={false} />)
    const {result} = render({
      directUploads: false,
      value,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
        ''
      )
    })
  })

  /* readOnly - the files input is read only or not */

  it('the upload button in the dropdown menu is disabled when the input is readOnly', async () => {
    // const {queryByTestId} = render(<FileInput value={value} readOnly />)
    const {result} = render({
      readOnly: true,
      value,
    })

    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-upload-button')!.getAttribute('data-disabled')).toBe(
        ''
      )
    })
  })

  it('does not allow for browsing when input is readOnly', async () => {
    // const {queryByTestId} = render(<FileInput value={value} readOnly />)
    const {result} = render({
      readOnly: true,
      value,
    })
    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(result.queryByTestId('file-input-browse-button')!.hasAttribute('data-disabled'))
    })
  })

  it('does not allow for browsing with multiple sources when input is readOnly', async () => {
    // const {queryByTestId} = render(
    //   <FileInput value={value} assetSources={[{name: 'source1'}, {name: 'source2'}]} readOnly />
    // )
    const {result} = render({
      assetSources: [{name: 'source1'}, {name: 'source2'}] as FIXME,
      readOnly: true,
      value,
    })
    fireEvent.click(result.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        result.queryByTestId('file-input-browse-button-source1')!.hasAttribute('data-disabled')
      )
      expect(
        result.queryByTestId('file-input-browse-button-source2')!.hasAttribute('data-disabled')
      )
    })
  })

  it('does not allow for clearing the input it is readOnly', async () => {
    // const {queryByTestId} = render(<FileInput value={value} readOnly />)
    const {result} = render({
      readOnly: true,
      value,
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

    const {result} = render({
      readOnly: true,
      schemaType: fileType as any as FileSchemaType,
      value,
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
