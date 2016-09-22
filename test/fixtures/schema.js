export default {
  name: 'test-schema',
  types: [
    {
      name: 'simple',
      type: 'object',
      fields: [
        {
          name: 'someString',
          type: 'string'
        },
        {name: 'someLatLon', type: 'latlon'},
        {name: 'home', type: 'homeAddress'}
      ]
    },
    {
      name: 'homeAddress',
      type: 'object',
      fields: [
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
