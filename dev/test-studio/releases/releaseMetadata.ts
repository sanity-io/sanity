import {defineField, defineReleaseMetadata} from 'sanity'

export const releaseMetadataFields = [
  defineField({
    name: 'legalReview',
    title: 'Legal review',
    type: 'string',
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
    fields: [
      defineField({name: 'reviewer', title: 'Reviewer', type: 'string'}),
      defineField({name: 'approved', title: 'Approved', type: 'boolean'}),
    ],
  }),
]

export const releaseMetadata = defineReleaseMetadata({
  fields: releaseMetadataFields,
})
