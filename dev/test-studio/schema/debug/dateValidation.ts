import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'dateValidation',
  type: 'document',
  fields: [
    defineField({
      name: 'requiredDate',
      type: 'date',
      validation: (Rule) => Rule.min('2024-01-01').required(),
    }),
    defineField({
      name: 'takenDate',
      title: 'Date taken (GH-1537 repro)',
      type: 'date',
      description:
        'Type something that does not match yyyy-mm-dd (e.g. "not-a-date"). ' +
        "After the GH-1537 fix, hovering the field's validation icon should " +
        'include "Invalid date. Must be on the format \\"YYYY-MM-DD\\"" in the tooltip.',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
      validation: (Rule) =>
        Rule.required().custom((takenDate) => {
          if (!takenDate) return true
          const regex = /^([1-9]\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
          return regex.test(takenDate) ? true : 'Please use yyyy-mm-dd'
        }),
    }),
    defineField({
      name: 'takenDateAsString',
      title: 'Date taken — string workaround (GH-1537)',
      type: 'string',
      description:
        'Same custom validator on a `string` field. Because string inputs commit ' +
        'every keystroke, the `.custom()` validator runs and the field-level ' +
        'tooltip shows "Please use yyyy-mm-dd" — included here for side-by-side ' +
        'comparison with the `date` field above.',
      validation: (Rule) =>
        Rule.required().custom((takenDate) => {
          if (!takenDate) return true
          const regex = /^([1-9]\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
          return regex.test(takenDate) ? true : 'Please use yyyy-mm-dd'
        }),
    }),
  ],
})
