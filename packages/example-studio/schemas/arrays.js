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
      name: 'arrayOfStringsWithLegacyList',
      title: 'Array of strings with legacy format on lists',
      description: 'Previously the `list` option took an array of {title, value} items. It should still work.',
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
  ]
}
