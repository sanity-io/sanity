import icon from 'react-icons/lib/go/puzzle'

export const myObject = {
  type: 'object',
  name: 'myObject',
  title: 'My object',
  icon,
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
        {name: 'level1', type: 'string', description: 'Level 1'},
        {
          name: 'fieldWithObjectType',
          title: 'Field of object type',
          type: 'object',
          description: 'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
          fields: [
            {name: 'level2', type: 'string', description: 'level 2'},
            {
              name: 'fieldWithObjectType',
              title: 'Field of object type',
              type: 'object',
              fields: [
                {name: 'level3', type: 'string', description: 'level 3'},
                {
                  name: 'fieldWithObjectType',
                  title: 'Field of object type',
                  type: 'object',
                  fields: [
                    {name: 'level4', type: 'string', description: 'level 4'},
                    {
                      name: 'fieldWithObjectType',
                      title: 'Field of object type',
                      type: 'object',
                      fields: [
                        {name: 'level5', type: 'string', description: 'level 5'},
                      ]
                    },
                  ]
                }
              ]
            },
          ]
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
