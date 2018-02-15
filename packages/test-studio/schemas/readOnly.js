import icon from 'react-icons/lib/md/text-format'

export default {
  name: 'readOnlyTest',
  type: 'document',
  title: 'Read only test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'This is a basic string field',
      readOnly: true
    },
    {
      name: 'select',
      type: 'string',
      title: 'Select string',
      description: 'Select a single string value from a set of predefined options. It should be possible to unset a selected value.',
      readOnly: true,
      options: {
        list: [
          {
            title: 'One (1)',
            value: 'one'
          },
          {
            title: 'Two (2)',
            value: 'two'
          },
          {
            title: 'Three (3)',
            value: 'three'
          }
        ]
      }
    },
    {
      name: 'radioSelectHorizontal',
      title: 'Select (layout: radio, direction: horizontal)',
      type: 'string',
      description: 'Select a single string value by choosing options from a list of radio buttons. It should *not* be possible to unset a selected value once its set.',
      readOnly: true,
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          {
            title: 'One (1)',
            value: 'one'
          },
          {
            title: 'Two (2)',
            value: 'two'
          },
          {
            title: 'Three (3)',
            value: 'three'
          }
        ]
      }
    },
    {
      name: 'selectObjectOfString',
      title: 'Select string in object',
      description: 'Select a single string value from an array of strings. It should be possible to unset a selected value.',
      type: 'string',
      readOnly: true,
      options: {
        list: ['one', 'two', 'three']
      }
    },
    {
      title: 'Reference to book or author',
      name: 'multiTypeRef',
      type: 'reference',
      readOnly: true,
      to: [{type: 'book'}, {type: 'author'}]
    },
    {
      name: 'anObject',
      type: 'object',
      title: 'A read only object',
      readOnly: true,
      fields: [
        {name: 'first', type: 'string'},
        {name: 'second', type: 'string'}
      ]
    },
    {
      name: 'myObject',
      type: 'myObject',
      title: 'MyObject',
      description: 'The first field here should be the title',
      readOnly: true
    },
    {
      title: 'Description',
      name: 'description',
      type: 'text',
      readOnly: true
    },
    {
      title: 'Number',
      name: 'popularity',
      type: 'number',
      readOnly: true
    },
    {
      title: 'Has the movie been released?',
      name: 'released',
      type: 'boolean',
      readOnly: true
    },
    {
      title: 'Has the movie been released?',
      name: 'releasedCheckbox',
      type: 'boolean',
      readOnly: true,
      options: {
        layout: 'checkbox'
      }
    },
    {
      name: 'tags',
      title: 'Tags',
      description: 'Enter a tag and press enter. Should result in an array of strings and should be possible to remove items',
      type: 'array',
      options: {layout: 'tags'},
      of: [{type: 'string'}],
      readOnly: true
    },
    {
      name: 'readOnlyArray',
      title: 'Polymorphic grid array',
      description: 'An array of multiple types. options: {layout: "grid"}',
      type: 'array',
      readOnly: true,
      of: [
        {
          title: 'A book',
          type: 'book'
        }
      ]
    },
    {
      name: 'readOnlyImage',
      title: 'Read only image field',
      type: 'image',
      readOnly: true,
      options: {hotspot: true},
      fields: [
        {
          title: 'Caption',
          type: 'string',
          name: 'caption',
          options: {isHighlighted: true}
        },
        {
          title: 'Attribution',
          name: 'attribution',
          type: 'string',
          options: {isHighlighted: true}
        },
        {
          title: 'Extra',
          name: 'extra',
          type: 'string'
        }
      ]
    },
    {
      name: 'readOnlyFile',
      title: 'Read only file field',
      type: 'file',
      readOnly: true,
      fields: [
        {
          title: 'Caption',
          type: 'string',
          name: 'caption',
          options: {isHighlighted: true}
        },
        {
          title: 'Attribution',
          name: 'attribution',
          type: 'string',
          options: {isHighlighted: true}
        },
        {
          title: 'Extra',
          name: 'extra',
          type: 'string'
        }
      ]
    }
  ]
}
