export default {
  name: 'arraysTest',
  type: 'object',
  title: 'Arrays test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'arrayOfPredefinedOptions',
      title: 'Array of predefined options',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'color',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            }
          ]
        }
      ],
      options: {
        direction: 'vertical',
        list: [
          {_type: 'color', title: 'Red', name: 'red', _key: 'red'},
          {_type: 'color', title: 'Green', name: 'green', _key: 'green'},
          1, // invalid, not defined in list
          {_type: 'color', title: 'Blue', name: 'blue', _key: 'blue'},
          {_type: 'color', title: 'Black', name: 'black', _key: 'black'},
        ]
      },
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
