export const myObject = {
  type: 'object',
  name: 'myObject',
  title: 'My object',
  fields: [
    {
      name: 'first',
      type: 'string',
      title: 'First',
    },
    {
      name: 'second',
      type: 'string',
      title: 'Second',
    }
  ],
}

export default {
  name: 'objectsTest',
  type: 'document',
  title: 'Objects test',
  preview: {
    select: {
      title: 'myObject.first'
    }
  },
  fieldsets: [
    {name: 'recursive', title: 'Recursive', options: {collapsable: true}}
  ],
  fields: [
    {
      name: 'myObject',
      type: 'myObject',
      title: 'MyObject',
      description: 'The first field here should be the title'
    },
    {
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description: 'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      fields: [
        {name: 'field1', type: 'string', description: 'This is a string field'},
        {
          name: 'field2',
          type: 'myObject',
          title: 'A field of myObject',
          description: 'This is another field of "myObject"'
        },
      ]
    },
    {
      name: 'recursive',
      title: 'This field is of type objectsTest',
      type: 'objectsTest',
      fieldset: 'recursive'
    }
  ]
}
