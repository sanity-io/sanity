import {defineArrayMember, defineField} from 'sanity'

export const collectionLinksType = defineField({
  name: 'collectionLinks',
  title: 'Collection links',
  type: 'array',
  validation: (Rule) => Rule.unique().max(4),
  of: [
    defineArrayMember({
      name: 'collection',
      type: 'reference',
      weak: true,
      to: [{type: 'collection'}],
    }),
  ],
})
