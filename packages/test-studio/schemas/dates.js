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
      type: 'date',
      title: 'Plain date (default config)',
      description: 'A plain date field'
    }
  ]
}
