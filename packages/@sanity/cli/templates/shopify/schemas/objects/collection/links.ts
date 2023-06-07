import {defineField} from 'sanity'

export default defineField({
  name: 'collectionLinks',
  title: 'Collection links',
  type: 'array',
  validation: (Rule) => Rule.unique().max(4),
  of: [
    {
      name: 'collection',
      type: 'reference',
      weak: true,
      to: [{type: 'collection'}],
    },
  ],
})
