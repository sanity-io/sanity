export default {
  name: 'datesTest',
  type: 'object',
  title: 'Date fields test',
  fieldsets: [
    {name: 'richDate', title: 'Rich Date', options: {collapsable: true}},
    {name: 'date', title: 'String Date', options: {collapsable: true}}
  ],

  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },

    // ------------- string dates

    {
      name: 'myStringDateField',
      type: 'date',
      title: 'String date with default config',
      description: 'A plain date field',
      fieldset: 'date'
    },
    {
      name: 'myUtcStringDateField',
      type: 'date',
      title: 'String date with inputUtc: true',
      description: 'A plain date field with inputUtc: true',
      options: {
        inputUtc: true
      },
      fieldset: 'date'
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
      },
      fieldset: 'date'
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
      },
      fieldset: 'date'
    },

    // ------------- rich dates

    {
      name: 'myDateField',
      type: 'richDate',
      title: 'Rich date with default config',
      description: 'A plain richDate field',
      fieldset: 'richDate'
    },
    {
      name: 'myUtcDateField',
      type: 'richDate',
      title: 'Rich date with inputUtc: true',
      description: 'A plain richDate field',
      options: {
        inputUtc: true
      },
      fieldset: 'richDate'
    },

    {
      name: 'myOnlyDateField',
      type: 'richDate',
      title: 'Only date picker',
      description: 'A plain richDate field',
      options: {
        inputDate: true,
        inputTime: false
      },
      fieldset: 'richDate'
    },
    {
      name: 'myOnlyTimeField',
      type: 'richDate',
      title: 'Only time picker',
      description: 'A default select with only time select',
      options: {
        inputDate: false,
        inputTime: true
      },
      fieldset: 'richDate'
    },
    {
      name: 'formatedDateField',
      type: 'richDate',
      title: 'Rich date with dateFormat: MMMM Do YYYY',
      description: 'A plain richDate field',
      options: {
        dateFormat: 'MMMM Do YYYY',
        calendarTodayLabel: 'Klikk her for å gå til idag'
      },
      fieldset: 'richDate'
    }
  ]
}
