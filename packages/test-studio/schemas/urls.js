export default {
  name: 'urlsTest',
  type: 'object',
  title: 'URLs test',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'myUrlField',
      type: 'url',
      title: 'Plain url',
      description: 'A plain URL field'
    }
  ]
}
