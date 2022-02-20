// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import {render, fireEvent, waitFor} from '@testing-library/react'
import Schema from '@sanity/schema'
import {DEFAULT_PROPS, ImageInputTester} from '../../../../utils/tests/ImageInputTester'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'imagesTest',
      type: 'document',
      title: 'Images test',
      description: 'Different test cases of image fields',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'mainImage',
          title: 'Image',
          type: 'image',
          description:
            'Image hotspot should be possible to change. Caption should be visible in image field, full description should be editable in modal',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              options: {
                isHighlighted: true,
              },
            },
            {
              name: 'detailedCaption',
              type: 'string',
              title: 'Detailed caption',
              options: {
                isHighlighted: true,
              },
              hidden: ({parent}) => !parent?.caption,
            },
            {
              name: 'foo',
              type: 'string',
              title:
                'This is a rather longish title for a field. It should still work. This is a rather longish title for a field. It should still work.',
              options: {
                isHighlighted: true,
              },
            },
            {
              name: 'description',
              type: 'string',
              title: 'Full description',
            },
          ],
        },
      ],
    },
  ],
})

const ImageInput = (changedProps) => (
  <ImageInputTester schema={schema} {...DEFAULT_PROPS} {...changedProps} />
)

describe('ImageInput with empty state', () => {
  it('renders an empty input as default', () => {
    const {queryByTestId, queryByText} = render(<ImageInput />)

    expect(queryByTestId('file-button-input').getAttribute('value')).toBe('')
    expect(queryByText('Drag or paste image here')).toBeInTheDocument()
  })

  it.todo('renders new image when a new image in uploaded')
  it.todo('renders new image when a new image is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button when it has at least one element in assetSources', () => {
    const {queryByTestId} = render(<ImageInput />)

    expect(queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(queryByTestId('file-input-browse-button')).toBeInTheDocument()
  })

  it('renders only the upload button when it has no assetSources', () => {
    const {queryByTestId} = render(<ImageInput assetSources={[]} />)

    expect(queryByTestId('file-input-upload-button')).toBeInTheDocument()
    expect(queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
  })

  it('renders the browse button with a tooltip when it has at least one element in assetSources', async () => {
    const {queryByTestId} = render(
      <ImageInput assetSources={[{name: 'source1'}, {name: 'source2'}]} />
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

  /* directUploads - allows for user to upload images directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', () => {
    const {queryByTestId} = render(<ImageInput directUploads={false} />)

    expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('true')
  })

  it('has default text that mentions that you cannot upload images when directUploads is false', async () => {
    const {queryByText} = render(<ImageInput directUploads={false} />)

    expect(queryByText(`Can't upload files here`)).toBeInTheDocument()
  })

  /* readOnly - the image input is read only or not */

  it('the upload button is disabled when the input is readOnly', () => {
    const {queryByTestId} = render(<ImageInput readOnly />)

    expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('true')
  })

  it('does not allow for browsing when input is readOnly', () => {
    const {queryByTestId} = render(<ImageInput readOnly />)

    expect(queryByTestId('file-input-browse-button').getAttribute('data-disabled')).toBe('true')
  })

  it('does not allow for upload when input is readOnly', async () => {
    const {queryByTestId, queryByText} = render(<ImageInput readOnly />)
    const input = queryByTestId('file-button-input')

    fireEvent.change(input, {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.png', {type: 'image/png'})],
      },
    })

    await waitFor(() => {
      expect(queryByText(`Read only`)).toBeInTheDocument()
    })
  })

  it.todo('does not allow files to be dragged & uploaded when it is readOnly')
})

describe('ImageInput with asset', () => {
  const value = {
    asset: {
      _ref: 'image-4ae478f00c330e7089cbd0f6126d3626e432e595-702x908-png',
      _type: 'reference',
    },
    _type: 'image',
  }

  const imageType = {
    options: {
      accept: 'image/png',
      hotspot: true,
    },
  }

  it('renders the right url as default when it has asset', () => {
    const {queryByTestId} = render(<ImageInput value={value} />)

    expect(queryByTestId('hotspot-image-input').getAttribute('src')).toBe(
      'https://cdn.sanity.io/images/some-project-id/some-dataset/4ae478f00c330e7089cbd0f6126d3626e432e595-702x908.png?w=2000&fit=max&auto=format'
    )
  })

  it.todo('renders new image when a new image in uploaded')
  it.todo('renders new image when a new image is dragged into the input')
  it.todo('is unable to upload when the file type is not allowed')

  /* assetSources - adds a list of sources that a user can pick from when browsing */

  it('renders the browse button in the image menu when it has at least one element in assetSources', async () => {
    const {queryByTestId} = render(<ImageInput value={value} />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button')).toBeInTheDocument()
    })
  })

  it('renders the browse button in the image menu when it has no assetSources', async () => {
    const {queryByTestId} = render(<ImageInput value={value} assetSources={[]} />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-upload-button')).toBeInTheDocument()
      expect(queryByTestId('file-input-browse-button')).not.toBeInTheDocument()
    })
  })

  it('renders the multiple browse buttons in the image menu when it has multiple assetSources', async () => {
    const {queryByTestId} = render(
      <ImageInput value={value} assetSources={[{name: 'source1'}, {name: 'source2'}]} />
    )
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button-source1')).toBeInTheDocument()
      expect(queryByTestId('file-input-browse-button-source2')).toBeInTheDocument()
    })
  })

  /* directUploads - allows for user to upload images directly (default is true) */

  it('renders the upload button as disabled when directUploads is false', async () => {
    const {queryByTestId} = render(<ImageInput value={value} directUploads={false} />)

    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('')
    })
  })

  /* readOnly - the image input is read only or not */

  it('the upload button in the dropdown menu is disabled when the input is readOnly', async () => {
    const {queryByTestId} = render(<ImageInput value={value} readOnly />)

    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('')
    })
  })

  it('does not allow for browsing when input is readOnly', async () => {
    const {queryByTestId} = render(<ImageInput value={value} readOnly />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button').hasAttribute('data-disabled'))
    })
  })

  it('does not allow for browsing with multiple sources when input is readOnly', async () => {
    const {queryByTestId} = render(
      <ImageInput value={value} assetSources={[{name: 'source1'}, {name: 'source2'}]} readOnly />
    )
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-browse-button-source1').hasAttribute('data-disabled'))
      expect(queryByTestId('file-input-browse-button-source2').hasAttribute('data-disabled'))
    })
  })

  it('does not allow for clearing the image when input is readOnly', async () => {
    const {queryByTestId} = render(<ImageInput value={value} readOnly />)
    fireEvent.click(queryByTestId('options-menu-button'))

    await waitFor(() => {
      expect(queryByTestId('file-input-clear').hasAttribute('data-disabled'))
    })
  })

  it('can open the edit details (if the option exists) dialog when the input is readOnly', async () => {
    const {queryByTestId} = render(<ImageInput value={value} type={imageType} readOnly />)
    expect(queryByTestId('options-menu-edit-details').getAttribute('data-disabled')).toBe('false')
  })

  it('does not allow for upload when input is readOnly & the image src is the same', async () => {
    const {queryByTestId} = render(<ImageInput value={value} type={imageType} readOnly />)

    fireEvent.click(queryByTestId('options-menu-button'))

    fireEvent.change(queryByTestId('file-button-input'), {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.png', {type: 'image/png'})],
      },
    })

    await waitFor(() => {
      expect(queryByTestId('hotspot-image-input').getAttribute('src')).toBe(
        'https://cdn.sanity.io/images/some-project-id/some-dataset/4ae478f00c330e7089cbd0f6126d3626e432e595-702x908.png?w=2000&fit=max&auto=format'
      )
    })
  })

  it.todo('does not allow files to be dragged & uploaded when it is readOnly')

  /* shows / hides edit details */

  it('hides the editing details if it doesnt have hotspot set', () => {
    const {queryByTestId} = render(<ImageInput value={value} type={imageType} />)
    expect(queryByTestId('options-menu-edit-details')).toBeInTheDocument()
  })
})
