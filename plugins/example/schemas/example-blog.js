export default {
  name: 'example-blog',
  types: {
    blogpost: {
      type: 'object',
      displayField: 'author',
      fields: {
        title: {
          title: 'Title',
          type: 'string'
        },
        priority: {
          title: 'Priority',
          type: 'number'
        },
        checked: {
          title: 'Checked',
          type: 'boolean'
        },
        lead: {
          title: 'Lead',
          type: 'text'
        },
        email: {
          title: 'Email',
          type: 'email'
        },
        location: {
          title: 'Location',
          type: 'latlon'
        },
        content: {
          type: 'array',
          of: [
            {
              title: 'String',
              type: 'string'
            }
          ]
        },
        authors: {
          title: 'Authors',
          type: 'array',
          of: [
            {type: 'author'}
          ]
        }
      }
    },
    latlon: {
      type: 'object',
      fields: {
        lat: {
          title: 'Latitude',
          type: 'number'
        },
        lon: {
          title: 'Longitude',
          type: 'number'
        }
      }
    },
    author: {
      type: 'object',
      fields: {
        name: {
          title: 'Title',
          type: 'string'
        },
        awards: {
          title: 'Awards',
          type: 'array',
          of: [
            {type: 'string'}
          ]
        }
      }
    }
  }
}
