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
      name: 'recursiveObject',
      type: 'recursiveObject',
      title: 'A field of a recursive object type'
    }
  ]
}
