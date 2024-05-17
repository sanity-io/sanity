import {defineField} from 'sanity'

export const menuType = defineField({
  name: 'menu',
  title: 'Menu',
  type: 'object',
  options: {
    collapsed: false,
    collapsible: true,
  },
  fields: [
    defineField({
      name: 'links',
      type: 'menuLinks',
    }),
  ],
})
