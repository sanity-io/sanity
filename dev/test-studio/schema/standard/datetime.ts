import {CalendarIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export default defineType({
  name: 'datetimeTest',
  type: 'document',
  title: 'Datetime test',
  icon: CalendarIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'justDefaults',
      type: 'datetime',
      title: 'Datetime with default config',
    },
    {
      name: 'aDateTimeWithCustomDateFormat',
      type: 'datetime',
      title: 'A datetime field with custom date format',
      options: {
        dateFormat: 'Do. MMMM YYYY',
      },
    },
    {
      name: 'aDateTimeWithDisplayTimezone',
      type: 'datetime',
      title: 'A datetime field with switchable display time zone',
      options: {
        displayTimeZone: 'Europe/Oslo',
        allowTimeZoneSwitch: true,
      },
    },
    {
      name: 'aDateTimeWithFixedDisplayTimezone',
      type: 'datetime',
      title: 'A datetime field with fixed display time zone',
      options: {
        displayTimeZone: 'Europe/Oslo',
        allowTimeZoneSwitch: false,
      },
    },
    {
      name: 'justARegularStringFieldInBetween',
      type: 'string',
      title: 'Some string',
      description: 'A string field in between',
    },
    {
      name: 'aDateTimeWithCustomTimeFormat',
      type: 'datetime',
      title: 'A datetime field with custom time format',
      options: {
        timeFormat: 'hh:mm',
      },
    },
    {
      name: 'aReadOnlyDateTime',
      type: 'datetime',
      title: 'A read only datetime',
      readOnly: true,
    },
    {
      name: 'aDateTimeWithCustomDateAndTimeFormat',
      type: 'datetime',
      title: 'A datetime field with a custom date AND time format',
      options: {
        dateFormat: 'Do. MMMM YYYY',
        timeFormat: 'hh:mm',
      },
    },
    {
      name: 'aDateFieldWithTimeStep',
      type: 'datetime',
      title: 'A date field with timeStep',
      options: {
        timeStep: 30,
      },
    },
    {
      name: 'customPlaceholder',
      type: 'datetime',
      title: 'Datetime without custom placeholder',
      placeholder: 'Enter a date here',
    },
    {
      name: 'startDate',
      type: 'datetime',
      title: 'Start date',
    },
    {
      name: 'endTime',
      type: 'datetime',
      title: 'End date',
      validation: (Rule) => Rule.min(Rule.valueOfField('startDate')),
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
              type: 'datetime',
              title: 'A datetime field with custom date format',
            },
          ],
        },
      ],
    },
  ],
})
