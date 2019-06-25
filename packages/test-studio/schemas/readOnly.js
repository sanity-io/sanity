import icon from 'react-icons/lib/md/text-format'
import React from 'react'

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
      name: 'slug',
      type: 'slug',
      readOnly: true,
      options: {
        source: document => document.title,
        maxLength: 96
      }
    },
    {
      name: 'select',
      type: 'string',
      title: 'Select string',
      description:
        'Select a single string value from a set of predefined options. It should be possible to unset a selected value.',
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
      description:
        'Select a single string value by choosing options from a list of radio buttons. It should *not* be possible to unset a selected value once its set.',
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
      description:
        'Select a single string value from an array of strings. It should be possible to unset a selected value.',
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
      fields: [{name: 'first', type: 'string'}, {name: 'second', type: 'string'}]
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
      name: 'date',
      title: 'Date',
      description: 'A read only date',
      type: 'datetime',
      readOnly: true
    },
    {
      name: 'tags',
      title: 'Tags',
      description:
        'Enter a tag and press enter. Should result in an array of strings and should be possible to remove items',
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
    },
    {
      name: 'readOnlyArrayOfPrimitives',
      title: 'Array with primitive types',
      description: 'This array contains only strings, values and booleans',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'string',
          title: 'String'
        },
        {
          type: 'number',
          title: 'Number'
        },
        {
          type: 'boolean',
          title: 'Boolean'
        }
      ]
    },
    {
      name: 'readOnlyArrayOfPredefinedOptions',
      title: 'Read only array of predefined options',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'object',
          name: 'color',
          fields: [
            {
              name: 'title',
              type: 'string'
            },
            {
              name: 'name',
              type: 'string'
            }
          ],
          preview: {
            select: {
              title: 'title',
              name: 'name'
            },
            prepare({title, name}) {
              return {
                title: title,
                media: () => (
                  <div
                    style={{
                      backgroundColor: name,
                      height: '100%',
                      width: '100%'
                    }}
                  />
                )
              }
            }
          }
        }
      ],
      options: {
        direction: 'vertical',
        list: [
          {_type: 'color', title: 'Red', name: 'red', _key: 'red'},
          {_type: 'color', title: 'Green', name: 'green', _key: 'green'},
          {_type: 'color', title: 'Blue', name: 'blue', _key: 'blue'},
          {_type: 'color', title: 'Black', name: 'black', _key: 'black'}
        ]
      }
    }
  ]
}
