import icon from 'part:@sanity/base/calendar-icon'

export default {
  name: 'richDateTest',
  type: 'document',
  title: 'RichDates (deprecated)',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'myDateField',
      type: 'richDate',
      title: 'Rich date with default config',
      description: 'A plain richDate field',
    },
    {
      name: 'myUtcDateField',
      type: 'richDate',
      title: 'Rich date with inputUtc: true',
      description: 'A plain richDate field',
      options: {
        inputUtc: true,
      },
    },

    {
      name: 'myOnlyDateField',
      type: 'richDate',
      title: 'Only date picker',
      description: 'A plain richDate field',
      options: {
        inputDate: true,
        inputTime: false,
      },
    },
    {
      name: 'myOnlyTimeField',
      type: 'richDate',
      title: 'Only time picker',
      description: 'A default select with only time select',
      options: {
        inputDate: false,
        inputTime: true,
      },
    },
    {
      name: 'formatedDateField',
      type: 'richDate',
      title: 'Rich date with dateFormat: MMMM Do YYYY',
      description: 'A plain richDate field',
      options: {
        dateFormat: 'MMMM Do YYYY',
        calendarTodayLabel: 'Klikk her for å gå til idag',
      },
    },
  ],
}
