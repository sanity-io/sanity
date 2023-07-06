import {defineField} from 'sanity'

export default defineField({
  name: 'menuLinks',
  title: 'menuLinks',
  type: 'array',
  of: [
    {
      name: 'collectionGroup',
      title: 'Collection group',
      type: 'collectionGroup',
    },
    {type: 'linkInternal'},
    {type: 'linkExternal'},
  ],
})
