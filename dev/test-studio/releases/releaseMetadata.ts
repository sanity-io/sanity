import {defineField, defineReleaseMetadata} from 'sanity'

export const releaseMetadata = defineReleaseMetadata({
  fieldsets: [
    {
      name: 'review',
      title: 'Review',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    defineField({
      name: 'legalReview',
      title: 'Legal review',
      type: 'string',
      fieldset: 'review',
      initialValue: 'notReviewed',
      options: {
        list: [
          {title: 'Not reviewed', value: 'notReviewed'},
          {title: 'Reviewed', value: 'reviewed'},
        ],
      },
    }),
    defineField({
      name: 'signOff',
      title: 'Sign-off',
      type: 'object',
      fieldset: 'review',
      fields: [
        defineField({name: 'reviewer', title: 'Reviewer', type: 'string'}),
        defineField({name: 'approved', title: 'Approved', type: 'boolean'}),
      ],
    }),
    defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      fieldset: 'review',
      validation: (rule) => rule.required().min(3),
    }),
  ],
})
