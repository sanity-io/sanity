export default {
  name: 'stringsTest',
  type: 'object',
  title: 'Strings test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'readonlyField',
      title: 'A read only string',
      type: 'string',
      readOnly: true
    },
    {
      name: 'tags',
      title: 'tags',
      type: 'array',
      options: {
        layout: 'tags'
      },
      of: [
        {type: 'string'}
      ]
    },
    {
      name: 'arrayOfStringsWithList',
      title: 'Array of strings with list',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {value: 'residential', title: 'Residential'},
          {value: 'education', title: 'Education'},
          {value: 'commercial', title: 'Commercial'},
          {value: 'cultural', title: 'Cultural'},
          {value: 'display', title: 'Display'},
          {value: 'installation', title: 'Installation'},
          {value: 'objects', title: 'Objects'},
          {value: 'performance', title: 'Performance'},
          {value: 'public space', title: 'Public Space'},
          {value: 'publications', title: 'Publications'}
        ]
      }
    },
    {
      name: 'select',
      title: 'Select string',
      type: 'string',
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
      name: 'selectObjectOfString',
      title: 'Select string in object',
      description: '',
      type: 'string',
      options: {
        list: ['one', 'two', 'three']
      }
    },
    {
      name: 'radioSelect',
      title: 'Select (layout: radio)',
      type: 'string',
      options: {
        layout: 'radio',
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
    }
  ]
}
