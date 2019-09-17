export default {
  name: 'exampleBlog',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      options: {
        preview: {
          fields: ['title', 'image', 'imageUrl'],
          prepare(document) {
            return {
              title: document.title || ''
            }
          }
        }
      },
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          options: {
            style: {
              backgroundColor: '#075d9c',
              color: '#fff'
            }
          },
          required: true
        },
        {
          name: 'priority',
          title: 'Priority',
          type: 'number'
        },
        {
          name: 'checked',
          title: 'Checked',
          type: 'boolean'
        },
        {
          name: 'lead',
          title: 'Lead',
          type: 'text',
          format: 'html',
          required: true
        },
        {
          name: 'email',
          title: 'Email',
          type: 'email'
        },
        {
          name: 'location',
          title: 'Location',
          type: 'latlon'
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          of: [
            {
              title: 'String',
              type: 'string'
            }
          ]
        },
        {
          name: 'authors',
          title: 'Authors',
          type: 'array',
          of: [
            {
              type: 'author'
            }
          ],
          required: true
        }
      ]
    },
    {
      name: 'latlon',
      type: 'object',
      fields: [
        {
          name: 'lat',
          title: 'Latitude',
          type: 'number',
          required: true
        },
        {
          name: 'lon',
          title: 'Longitude',
          type: 'number',
          required: true
        }
      ]
    },
    {
      name: 'author',
      type: 'object',
      title: 'Author',
      description: 'Fill inn information about the author',
      fields: [
        {
          name: 'name',
          title: 'Title',
          type: 'string'
        },
        {
          name: 'awards',
          title: 'Awards',
          type: 'array',
          of: [
            {
              type: 'string'
            }
          ]
        },
        {
          name: 'homestead',
          title: 'Homestead',
          type: 'object',
          fields: [
            {
              name: 'lat',
              title: 'Latitude',
              type: 'number',
              required: true
            },
            {
              name: 'lon',
              title: 'Longitude',
              type: 'number',
              required: true
            }
          ]
        }
      ]
    }
  ]
}
