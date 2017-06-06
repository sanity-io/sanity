export default {
  name: 'datesTest',
  type: 'object',
  title: 'Date fields test',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'myDateField',
      type: 'richDate',
      title: 'Rich date with default config',
      description: 'A plain richDate field'
    },
    {
      name: 'myDeprecatedDateField',
      type: 'date',
      title: 'A field with type: date',
      description: 'Should still work, but display a deprecation warning'
    }
  ]
}
