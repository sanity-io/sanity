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
  it('renders an empty input as default', async () => {
    const {queryByTestId} = render(<ImageInput />)

    expect(queryByTestId('file-button-input').getAttribute('value')).toBe('')
  })

  it.todo('does not allow for upload files based on file type')

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

  it('does not allow for drag upload of image when directUploads is false', async () => {
    const {queryByTestId, queryByText} = render(<ImageInput directUploads={false} />)
    const input = queryByTestId('file-button-input')

    fireEvent.change(input, {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.png', {type: 'image/png'})],
      },
    })

    await waitFor(() => {
      expect(queryByText(`Can't upload files here`)).toBeInTheDocument()
    })
  })

  /* readOnly - the image input is read only or not */

  it('does not allow for upload when input is readOnly', () => {
    const {queryByTestId} = render(<ImageInput readOnly />)

    expect(queryByTestId('file-input-upload-button').getAttribute('data-disabled')).toBe('true')
  })

  it('does not allow for browsing when input is readOnly', () => {
    const {queryByTestId} = render(<ImageInput readOnly />)

    expect(queryByTestId('file-input-browse-button').getAttribute('data-disabled')).toBe('true')
  })

  it('does not allow for drag upload of image when input is readOnly', async () => {
    /*const {queryByTestId, queryByText, debug} = render(<ImageInput readOnly />)
    const input = queryByTestId('file-button-input')

    fireEvent.change(input, {
      target: {
        files: [new File(['(⌐□_□)'], 'cool_sunglasses.png', {type: 'image/png'})],
      },
    })

    debug(undefined, 3000)
    await waitFor(() => {
      expect(queryByText(`Read only`)).toBeInTheDocument()
    })
  })*/
})

describe('with asset', () => {
  it('renders the right url as default when it has asset', () => {
    const value = {
      asset: {
        _ref: 'image-4ae478f00c330e7089cbd0f6126d3626e432e595-702x908-png',
        _type: 'reference',
      },
      _type: 'image',
    }

    const {queryByTestId} = render(<ImageInput value={value} />)

    expect(queryByTestId('hotspot-image-input').getAttribute('src')).toBe(
      'https://cdn.sanity.io/images/undefined/undefined/4ae478f00c330e7089cbd0f6126d3626e432e595-702x908.png'
    )
  })
})
