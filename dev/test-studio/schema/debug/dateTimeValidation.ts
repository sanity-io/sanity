import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'dateTimeValidation',
  type: 'document',
  fields: [
    defineField({
      name: 'requiredDatetime',
      type: 'datetime',
      validation: (Rule) => Rule.min('2024-01-01 00:00').required(),
    }),
    defineField({
      name: 'takenDatetime',
      title: 'Date taken (GH-1537 datetime repro)',
      type: 'datetime',
      description:
        'Type something that does not match the configured format. ' +
        'Per the issue the custom validator below should — but does not — ' +
        'fire for input that fails parsing.',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
      },
      validation: (Rule) =>
        Rule.required().custom((takenDatetime) => {
          if (!takenDatetime) return true
          // ISO 8601 with optional milliseconds and a Z suffix, which is what
          // the datetime input serializes when parsing succeeds.
          const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z?$/
          return regex.test(takenDatetime) ? true : 'Please use an ISO 8601 datetime'
        }),
    }),
  ],
})
