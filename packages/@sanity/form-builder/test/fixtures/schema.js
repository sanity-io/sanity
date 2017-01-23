export default {
  name: 'test-schema',
  types: [
    {
      name: 'user',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string'
        },
        {
          name: 'addresses',
          type: 'array',
          of: [
            {
              type: 'address'
            }
          ]
        }
      ]
    },
    {
      name: 'address',
      type: 'object',
      fields: [
        {name: 'street', type: 'string'},
        {name: 'zip', type: 'string'},
        {name: 'location', type: 'latlon'}
      ]
    },
    {
      name: 'latlon',
      type: 'object',
      fields: [
        {
          name: 'lat',
          title: 'Latitude',
          type: 'number'
        },
        {
          name: 'lon',
          title: 'Longitude',
          type: 'number'
        }
      ]
    }
  ]
}
