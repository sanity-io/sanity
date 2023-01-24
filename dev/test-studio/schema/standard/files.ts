import {BinaryDocumentIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export default defineType({
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
      fieldsets: [
        {
          name: 'less-important',
          title: 'Less important fields',
          options: {collapsible: true, collapsed: true},
        },
      ],
      fields: [
        {
          title: 'Description',
          name: 'description',
          type: 'string',
        },
        {
          title: 'Additional description',
          name: 'additionalDescription',
          type: 'string',
          hidden: ({parent}) => !parent?.description,
        },
        {
          title: 'Less important',
          name: 'lessImportant',
          type: 'string',
          fieldset: 'less-important',
        },
        {
          title: 'Less important too',
          name: 'lessImportant2',
          type: 'string',
          fieldset: 'less-important',
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
      name: 'fileWithoutOriginalFilename',
      title: 'File without original filename',
      type: 'file',
      options: {
        storeOriginalFilename: false,
      },
    },
    {
      name: 'filepdf',
      title: 'File only accepts pdf',
      type: 'file',
      description: 'Should not accept other files types than pdf',
      options: {
        accept: '.pdf',
      },
    },
  ],
})
