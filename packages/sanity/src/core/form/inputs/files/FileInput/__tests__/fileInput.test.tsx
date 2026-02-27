import {type FileAsset, type FileSchemaType} from '@sanity/types'
import {screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type Observable, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

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
    expect(screen.queryByTestId('file-button-input')!.getAttribute('value')).toBe('')
  })

  it.todo('renders new file when a new file in uploaded')

  it('shows invalid file warning when asset ref is not a valid file source', async () => {
    // Value with asset ref that doesn't match file asset id format (e.g. deleted/broken ref)
    const invalidValue = {
      _type: 'file',
      asset: {_ref: 'document-invalid-or-deleted', _type: 'reference'},
    }
    await renderFileInput({
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeAssetStub,
      props: {documentValue: {someFile: invalidValue}},
      render: (inputProps) => <BaseFileInput {...inputProps} value={invalidValue} />,
    })
    expect(screen.getByText('Invalid file value')).toBeInTheDocument()
  })

  it('respects schema options.accept for file type', async () => {
    await renderFileInput({
      fieldDefinition: {
        name: 'someFile',
        title: 'PDF only',
        type: 'file',
        options: {accept: 'application/pdf'},
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })
    const fileInput = screen.getByTestId('file-button-input')
    expect(fileInput).toHaveAttribute('accept', 'application/pdf')
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

    expect(
      screen.queryByTestId('file-input-browse-button-test-source')!.getAttribute('data-disabled'),
    ).toBe('true')
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

    expect(
      screen.queryByTestId('file-input-browse-button-test-source')!.getAttribute('data-disabled'),
    ).toBe('true')
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

    const input = screen.queryByTestId('file-button-input')

    await userEvent.upload(input!, new File(['(⌐□_□)'], 'cool_sunglasses.pdf', {type: 'file/pdf'}))

    await waitFor(() => {
      expect(screen.getByText('Read only')).toBeInTheDocument()
    })
  })
})
// Drag-to-upload is tested in common/__tests__/uploadTarget.test.tsx

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

    expect(screen.getByText('cats.txt')).toBeInTheDocument()
    expect(screen.getByText('31 Bytes')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')

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

    await userEvent.click(screen.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        screen.queryByTestId('file-input-browse-button-test-source')!.getAttribute('data-disabled'),
      ).toBe('')
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

    await userEvent.click(screen.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        screen.queryByTestId('file-input-browse-button-test-source')!.hasAttribute('data-disabled'),
      )
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

    await userEvent.click(screen.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(
        screen.queryByTestId('file-input-browse-button-source1')!.hasAttribute('data-disabled'),
      )
      expect(
        screen.queryByTestId('file-input-browse-button-source2')!.hasAttribute('data-disabled'),
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

    await userEvent.click(screen.queryByTestId('options-menu-button')!)

    await waitFor(() => {
      expect(screen.queryByTestId('file-input-clear')!.hasAttribute('data-disabled'))
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

    await userEvent.click(screen.queryByTestId('options-menu-button')!)

    await userEvent.upload(
      screen.queryByTestId('file-button-input')!,
      new File(['(⌐□_□)'], 'cool_sunglasses.pdf', {type: 'file/pdf'}),
    )

    await waitFor(() => {
      expect(screen.getByText('cats.txt')).toBeInTheDocument()
      expect(screen.getByText('31 Bytes')).toBeInTheDocument()
    })
  })
})
