// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import {render, fireEvent, waitFor} from '@testing-library/react'
import Schema from '@sanity/schema'
import {DEFAULT_PROPS, FileInputTester} from '../../../../utils/tests/FileInputTester'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
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
    },
  ],
})

const FileInput = (changedProps) => (
  <FileInputTester schema={schema} {...DEFAULT_PROPS} {...changedProps} />
)

describe('FileInput with empty state', () => {
  it('renders an empty input as default', () => {
    const {queryByTestId, queryByText} = render(<FileInput />)

    expect(queryByTestId('file-button-input').getAttribute('value')).toBe('')
    expect(queryByText('Drag or paste file here')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button when it has at least one element in assetSources', () => {
    const {queryByTestId} = render(<FileInput />)

    expect(queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(queryByTestId('file-input-browse-button')).toBeInTheDocument()
  })

  it('renders only the upload button when it has no assetSources', () => {
    const {queryByTestId} = render(<FileInput assetSources={[]} />)

    expect(queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
  })

  it('renders the browse button with a tooltip when it has at least one element in assetSources', async () => {
    const {queryByTestId} = render(
      <FileInput assetSources={[{name: 'source1'}, {name: 'source2'}]} />
    )
    const browseButton = queryByTestId('file-input-multi-browse-button')

    expect(queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(browseButton).toBeInTheDocument()

    fireEvent.click(browseButton)

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button-source1')).toBeInTheDocument()
      expect(queryByTestId('file-input-browse-button-source2')).toBeInTheDocument()
    })
  })

  /* directUploads - allows for user to upload files directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', () => {
    const {queryByTestId} = render(<FileInput directUploads={false} />)

    expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('true')
  })

  it('has default text that mentions that you cannot upload files when directUploads is false', async () => {
    const {queryByText} = render(<FileInput directUploads={false} />)

    expect(queryByText(`Can't upload files here`)).toBeInTheDocument()
  })

  /* readOnly - the file input is read only or not */

  it('the upload button is disabled when the input is readOnly', () => {
    const {queryByTestId} = render(<FileInput readOnly />)

    expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('true')
  })

  it('does not allow for browsing when input is readOnly', () => {
    const {queryByTestId} = render(<FileInput readOnly />)

    expect(queryByTestId('file-input-browse-button').getAttribute('data-disabled')).toBe('true')
  })

  it('does not allow for upload when input is readOnly', async () => {
    const {queryByTestId, queryByText} = render(<FileInput readOnly />)
    const input = queryByTestId('file-button-input')

    fireEvent.change(input, {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.pdf', {type: 'file/pdf'})],
      },
    })

    await waitFor(() => {
      expect(queryByText(`Read only`)).toBeInTheDocument()
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
    const {queryByText} = render(<FileInput value={value} />)

    expect(queryByText('cats.txt')).toBeInTheDocument()
    expect(queryByText('31 Bytes')).toBeInTheDocument()
  })

  it.todo('renders new file when a new file in uploaded')
  it.todo('renders new file when a new file is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button in the file menu when it has at least one element in assetSources', async () => {
    const {queryByTestId} = render(<FileInput value={value} />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button')).toBeInTheDocument()
    })
  })

  it('renders the browse button in the file menu when it has no assetSources', async () => {
    const {queryByTestId} = render(<FileInput value={value} assetSources={[]} />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-upload-button')).toBeInTheDocument()
      expect(queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
    })
  })

  it('renders the multiple browse buttons in the file menu when it has multiple assetSources', async () => {
    const {queryByTestId} = render(
      <FileInput value={value} assetSources={[{name: 'source1'}, {name: 'source2'}]} />
    )
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button-source1')).toBeInTheDocument()
      expect(queryByTestId('file-input-browse-button-source2')).toBeInTheDocument()
    })
  })

  /* directUploads - allows for user to upload files directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', async () => {
    const {queryByTestId} = render(<FileInput value={value} directUploads={false} />)

    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('true')
    })
  })

  /* readOnly - the files input is read only or not */

  it('the upload button in the dropdown menu is disabled when the input is readOnly', async () => {
    const {queryByTestId} = render(<FileInput value={value} readOnly />)

    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('true')
    })
  })

  it('does not allow for browsing when input is readOnly', async () => {
    const {queryByTestId} = render(<FileInput value={value} readOnly />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button').hasAttribute('data-disabled'))
    })
  })

  it('does not allow for browsing with multiple sources when input is readOnly', async () => {
    const {queryByTestId} = render(
      <FileInput value={value} assetSources={[{name: 'source1'}, {name: 'source2'}]} readOnly />
    )
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button-source1').hasAttribute('data-disabled'))
      expect(queryByTestId('file-input-browse-button-source2').hasAttribute('data-disabled'))
    })
  })

  it('does not allow for clearing the input it is readOnly', async () => {
    const {queryByTestId} = render(<FileInput value={value} readOnly />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-clear').hasAttribute('data-disabled'))
    })
  })

  it('does not allow for upload when input is readOnly & the image src is the same', async () => {
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

    const {queryByText, queryByTestId} = render(
      <FileInput value={value} type={fileType} readOnly />
    )

    fireEvent.click(queryByTestId('options-menu-button'))

    fireEvent.change(queryByTestId('file-button-input'), {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.pdf', {type: 'file/pdf'})],
      },
    })

    await waitFor(() => {
      expect(queryByText('cats.txt')).toBeInTheDocument()
      expect(queryByText('31 Bytes')).toBeInTheDocument()
    })
  })

  it.todo('does not allow files to be dragged & uploaded when it is readOnly')
})
