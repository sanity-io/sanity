import {PackageIcon} from '@sanity/icons'
import {defineField} from 'sanity'

export default defineField({
  name: 'collectionGroup',
  title: 'Collection group',
  type: 'object',
  icon: PackageIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'collectionLinks',
      title: 'Collection links',
      type: 'collectionLinks',
    },
    {
      name: 'collectionProducts',
      title: 'Collection products',
      type: 'reference',
      description: 'Products from this collection will be listed',
      weak: true,
      to: [{type: 'collection'}],
    },
  ],
})
