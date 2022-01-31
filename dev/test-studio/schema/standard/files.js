import {BinaryDocumentIcon} from '@sanity/icons'

export default {
  name: 'filesTest',
  type: 'document',
  title: 'Files test',
  icon: BinaryDocumentIcon,
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
    {
      name: 'arrayOfFiles',
      title: 'An array of files',
      type: 'array',
      of: [{type: 'file'}],
    },
    {
      name: 'fileWithFields',
      title: 'File with additional fields',
      type: 'file',
      fields: [
        {
          title: 'Description',
          name: 'description',
          type: 'string',
          options: {isHighlighted: true},
        },
        {
          title: 'Additional description',
          name: 'additionalDescription',
          type: 'string',
          options: {isHighlighted: true},
          hidden: ({parent}) => !parent?.description,
        },
        {
          title: 'Not so important',
          name: 'notsoimportant',
          type: 'string',
        },
      ],
    },
    {
      name: 'readOnly',
      title: 'A read only file field',
      type: 'file',
      readOnly: true,
    },
    {
      name: 'readOnlyWithFields',
      title: 'A read only file with fields',
      type: 'file',
      readOnly: true,
      fields: [
        {
          title: 'Description',
          name: 'description',
          type: 'string',
        },
        {
          title: 'Not so important',
          name: 'notsoimportant',
          type: 'string',
        },
      ],
    },
    {
      name: 'fileWithoutOriginalFilename',
      title: 'File without original filename',
      type: 'file',
      options: {
        storeOriginalFilename: false,
      },
    },
  ],
}
