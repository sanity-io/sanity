import {defineField, defineVariantMetadata} from 'sanity'

export const variantMetadata = defineVariantMetadata({
  fields: [
    defineField({
      name: 'owner',
      title: 'Owner',
      type: 'string',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires at',
      type: 'datetime',
    }),
  ],
})
