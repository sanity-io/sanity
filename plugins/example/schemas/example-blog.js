export default {
  name: 'example-blog',
  types: [
    {
      'name': 'blogpost',
      'type': 'object',
      'displayField': 'author',
      'fields': [
        {
          'name': 'title',
          'title': 'Title',
          'type': 'string'
        },
        {
          'name': 'priority',
          'title': 'Priority',
          'type': 'number'
        },
        {
          'name': 'checked',
          'title': 'Checked',
          'type': 'boolean'
        },
        {
          'name': 'lead',
          'title': 'Lead',
          'type': 'text'
        },
        {
          'name': 'email',
          'title': 'Email',
          'type': 'email'
        },
        {
          'name': 'location',
          'title': 'Location',
          'type': 'latlon'
        },
        {
          'name': 'content',
          'type': 'array',
          'of': [
            {
              'title': 'String',
              'type': 'string'
            }
          ]
        },
        {
          'name': 'authors',
          'title': 'Authors',
          'type': 'array',
          'of': [
            {
              'type': 'author'
            }
          ]
        }
      ]
    },
    {
      'name': 'latlon',
      'type': 'object',
      'fields': [
        {
          'name': 'lat',
          'title': 'Latitude',
          'type': 'number'
        },
        {
          'name': 'lon',
          'title': 'Longitude',
          'type': 'number'
        }
      ]
    },
    {
      'name': 'author',
      'type': 'object',
      'fields': [
        {
          'name': 'name',
          'title': 'Title',
          'type': 'string'
        },
        {
          'name': 'awards',
          'title': 'Awards',
          'type': 'array',
          'of': [
            {
              'type': 'string'
            }
          ]
        }
      ]
    }
  ]
}
