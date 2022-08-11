export default {
  name: 'conditionalFieldsTest',
  type: 'document',
  title: 'Conditional fields',
  readOnly: () => false,
  fields: [
    {
      name: 'readOnly',
      title: 'Read-only',
      type: 'boolean',
    },
    {
      name: 'hidden',
      title: 'Hidden',
      type: 'boolean',
    },
    {
      name: 'title',
      type: 'string',
      description: 'Title',
    },
    {
      name: 'isPublished',
      type: 'boolean',
      description: 'Is published?',
      // readOnly: () => true,
    },
    {
      name: 'readOnlyIfTitleIsReadOnly',
      type: 'string',
      description: 'This will be read only if the document title contains the string `read only`',
      readOnly: ({document}) => {
        return Boolean(document.title && document.title.includes('read only'))
      },
    },
    {
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description: 'Becomes read-only if the readOnly is true',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
      fields: [
        {
          name: 'readOnly',
          title: 'Read-only',
          type: 'boolean',
        },
        {
          name: 'hidden',
          title: 'Hidden',
          type: 'boolean',
        },
        {
          name: 'field1',
          type: 'string',
          description: 'Try typing "hide field 2" here',
          readOnly: true,
        },
        {
          name: 'field2',
          type: 'string',
          description: 'This will be hidden if you type "hide field 2" into field 1',
          hidden: ({parent}) => parent?.field1 === 'hide field 2',
        },
        {
          name: 'roleConditionField',
          type: 'string',
          description: 'This will be hidden unless current user has the administrator role',
          hidden: ({currentUser}) => !currentUser.roles.some((r) => r.name === 'administrator'),
        },
        {
          name: 'hiddenIfPublished',
          type: 'string',
          description: 'This will be hidden if the document is published',
          hidden: ({document}) => Boolean(document.isPublished),
        },
        {
          name: 'readOnlyIfPublished',
          type: 'string',
          description: 'This will be read only if the document is published',
          readOnly: ({document}) => document.isPublished,
        },
        {
          name: 'readOnlyIfTitleIsReadOnly',
          type: 'string',
          description:
            'This will be read only if the document title contains the string `read only`',
          readOnly: ({document}) => {
            return Boolean(document.title && document.title.toLowerCase().includes('read only'))
          },
        },
        {
          name: 'field3',
          type: 'string',
          description: 'This will be hidden if its value becomes "hideme"',
          hidden: ({value}) => value === 'hid',
        },
      ],
    },
    {
      name: 'arrayReadOnly',
      type: 'array',
      of: [{type: 'string'}, {type: 'number'}],
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
    },
    {
      name: 'myImage',
      title: 'Image type with fields',
      type: 'image',
      readOnly: ({document}) => {
        return Boolean(!document.readOnly)
      },
      fields: [
        {
          name: 'caption',
          title: 'Caption',
          type: 'string',
          readOnly: ({document}) => {
            return Boolean(document.readOnly)
          },
        },
      ],
    },
    {
      name: 'imageReadOnly',
      type: 'image',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
    },
    {
      name: 'fileReadOnly',
      type: 'file',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
    },
    {
      name: 'myFile',
      title: 'File type with fields',
      type: 'file',
      readOnly: ({document}) => {
        return Boolean(!document.readOnly)
      },
      fields: [
        {
          name: 'caption',
          title: 'Caption',
          type: 'string',
          readOnly: ({document}) => {
            return Boolean(document.readOnly)
          },
        },
      ],
    },
    {
      name: 'arrayOfStrings',
      title: 'Array of strings',
      description: 'This array contains only strings, with no title',
      type: 'array',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.required().min(10).max(80),
          readOnly: ({document}) => {
            return Boolean(document.readOnly)
          },
          hidden: ({document}) => {
            return Boolean(document.hidden)
          },
        },
        {
          type: 'number',
          validation: (Rule) => Rule.required().min(10).max(80),
          readOnly: ({document}) => {
            return Boolean(!document.readOnly)
          },
          hidden: ({document}) => {
            return Boolean(!document.hidden)
          },
        },
      ],
    },
    {
      name: 'predefinedStringArray',
      title: 'Array of strings',
      type: 'array',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
      of: [{type: 'string'}, {type: 'number'}],
      options: {
        list: [
          {title: 'Cats', value: 'cats4ever'},
          {title: 'Dogs', value: 'dogs4ever'},
          {title: 'Number', value: 0},
        ],
      },
    },
    {
      name: 'arrayOfMultipleTypes',
      title: 'Array of multiple types',
      type: 'array',
      readOnly: ({document}) => Boolean(document.readOnly),
      of: [
        {
          type: 'image',
          readOnly: () => true,
        },
        {
          type: 'book',
        },
        {
          type: 'object',
          name: 'color',
          title: 'Color with a long title',
          readOnly: () => true,
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    },
  ],
}
