export default {
  name: 'geopoint',
  type: 'object',
  fields: [
    {
      name: 'lat',
      type: 'number',
      title: 'Latitude',
      required: true
    },
    {
      name: 'lng',
      type: 'number',
      title: 'Longitude',
      required: true
    }
  ]
}
