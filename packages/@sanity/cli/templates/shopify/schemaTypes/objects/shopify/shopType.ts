import {defineField} from 'sanity'

export const shopType = defineField({
  name: 'shop',
  title: 'Shop',
  type: 'object',
  readOnly: true,
  fields: [
    defineField({
      name: 'domain',
      title: 'Domain',
      type: 'string',
    }),
  ],
})
