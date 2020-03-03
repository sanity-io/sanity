import icon from 'react-icons/lib/go/puzzle'

export const recursiveObject = {
  type: 'object',
  name: 'recursiveObject',
  title: 'Recursive object',
  icon,
  options: {collapsible: false, collapsed: false},
  fields: [
    {
      name: 'first',
      type: 'string',
      title: 'First'
    },
    {
      name: 'someArray',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [{name: 'foo', type: 'string'}]
        }
      ]
    },
    {
      name: 'second',
      type: 'string',
      title: 'Second'
    },
    {
      name: 'myself',
      title: 'A field of my own type',
      type: 'recursiveObject'
    }
  ]
}

export default {
  name: 'recursiveObjectTest',
  type: 'document',
  title: 'Recursive Objects test',
  preview: {
    select: {
      title: 'recursiveObject.first'
    }
  },
  fields: [
    {
      name: 'arrayOfRecursiveObjects',
      type: 'array',
      of: [{type: 'recursiveObject'}],
      title: 'A field of a recursive object type'
    },
    {
      name: 'recursiveObject',
      type: 'recursiveObject',
      title: 'A field of a recursive object type'
    },
    ...[1, 2, 3, 4].map(n => ({
      name: `myself${n}`,
      title: `Field ${n}`,
      type: 'recursiveObject'
    }))
  ]
}
