import {CalendarIcon} from '@sanity/icons'

export default {
  name: 'dateTest',
  type: 'document',
  title: 'Date test',
  icon: CalendarIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'justDefaults',
      type: 'date',
      title: 'Datetime with default config',
    },
    {
      name: 'aDateWithCustomDateFormat',
      type: 'date',
      title: 'A date field with custom date format',
      options: {
        dateFormat: 'Do. MMMM YYYY',
      },
    },
    {
      name: 'justARegularStringFieldInBetween',
      type: 'string',
      title: 'Some string',
      description: 'A string field in between',
    },
    {
      name: 'aDateWithDefaults',
      type: 'date',
      title: 'A date field with defaults',
    },
    {
      name: 'aReadOnlyDate',
      type: 'date',
      title: 'A read only date',
      readOnly: true,
    },
    {
      name: 'customPlaceholder',
      type: 'date',
      title: 'Date without custom placeholder',
      placeholder: 'Enter a date here',
    },
    {
      name: 'inArray',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'date',
              type: 'date',
              title: 'A date field in an array',
            },
          ],
        },
      ],
    },
  ],
}
