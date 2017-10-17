export default {
  name: 'dateTest',
  type: 'object',
  title: 'Dates test',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'justDefaults',
      type: 'date',
      title: 'String date with default config',
      description: 'A plain date field'
    },
    {
      name: 'myUtcStringDateField',
      type: 'date',
      title: 'String date with inputUtc: true',
      description: 'A plain date field with inputUtc: true',
      options: {
        inputUtc: true
      }
    },
    {
      name: 'justARegularStringFieldInBetween',
      type: 'string',
      title: 'Some string',
      description: 'A string field in between',
    },
    {
      name: 'myUtcStringDateWithoutTimeField',
      type: 'date',
      title: 'String date without time',
      description: 'A plain date field without time',
      options: {
        inputDate: true,
        inputTime: false,
        dateFormat: 'Do. MMMM YYYY'
      }
    },
    {
      name: 'myUtcStringDateWithoutDateField',
      type: 'date',
      title: 'String date without date',
      description: 'A plain date field with timeStep, without date',
      options: {
        inputDate: false,
        inputTime: true,
        dateFormat: 'HH:mm',
        timeStep: 30
      }
    }
  ]
}
