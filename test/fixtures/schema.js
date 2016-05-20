export default {
  name: 'test-schema',
  types: {
    simple: {
      type: 'object',
      fields: {
        someString: {type: 'string'},
        someLatLon: {type: 'latlon'},
        home: {type: 'homeAddress'}
      }
    },
    homeAddress: {
      type: 'object',
      fields: {
        zip: {type: 'string'},
        location: {type: 'latlon'}
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
    }
  }
}
