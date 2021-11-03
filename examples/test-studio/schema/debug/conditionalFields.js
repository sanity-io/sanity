export default {
  name: 'conditionalFieldsTest',
  type: 'document',
  title: 'Conditional fields',

  fields: [
    {
      name: 'title',
      type: 'string',
      description: 'Title',
    },
    {
      name: 'isPublished',
      type: 'boolean',
      description: 'Is published?',
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
      description: 'Becomes read-only if the title includes read only',
      readOnly: ({document}) => {
        return Boolean(document.title && document.title.includes('read only'))
      },
      fields: [
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
          hidden: ({document}) => document.isPublished,
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
          hidden: ({value}) => value === 'hideme',
        },
      ],
    },
    {
      name: 'arrayReadOnly',
      type: 'array',
      of: [{type: 'string'}, {type: 'number'}],
      readOnly: true,
    },
    {
      name: 'imageReadOnly',
      type: 'image',
      readOnly: ({document}) => Boolean(document?.isPublished),
    },
    {
      name: 'fileReadOnly',
      type: 'file',
      readOnly: ({document}) =>
        Boolean(document.title && document.title.toLowerCase().includes('read only')),
    },
  ],
}
