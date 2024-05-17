import {defineField} from 'sanity'

export const inventoryType = defineField({
  name: 'inventory',
  title: 'Inventory',
  type: 'object',
  options: {
    columns: 3,
  },
  fields: [
    defineField({
      name: 'isAvailable',
      title: 'Available',
      type: 'boolean',
    }),
    defineField({
      name: 'management',
      type: 'string',
    }),
    defineField({
      name: 'policy',
      type: 'string',
    }),
  ],
})
