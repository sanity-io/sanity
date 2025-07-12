// import {TiInfinity as icon} from 'react-icons/ti'

export const simpleArrayOfObjects = {
  name: 'simpleArrayOfObjects',
  type: 'document',
  title: 'Simple array of objects',
  // icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'arrayWithObjects',
      options: {collapsible: true, collapsed: true, dragHandle: true},
      title: 'Array with named objects',
      description: 'This array contains objects of type as defined inline',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'something',
          title: 'Something',
          fields: [{name: 'first', type: 'string', title: 'First string'}],
        },
      ],
    },
  ],
}
