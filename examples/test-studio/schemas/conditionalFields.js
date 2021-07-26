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
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description:
        'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      fields: [
        {
          name: 'field1',
          type: 'string',
          description: 'Try typing "hide field 2" here',
        },
        {
          name: 'field2',
          type: 'string',
          description: 'This will be hidden if you type "hide field 2" into field 1',
          hidden: ({parent}) => parent?.field1 === 'hide field 2',
        },
        {
          name: 'hiddenIfPublished',
          type: 'string',
          description: 'This will be hidden if the document is published',
          hidden: ({document}) => document.isPublished,
        },
        {
          name: 'field3',
          type: 'string',
          description: 'This will be hidden if its value becomes "hideme"',
          hidden: ({value}) => value === 'hideme',
        },
      ],
    },
  ],
}
