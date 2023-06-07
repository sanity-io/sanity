import {defineField} from 'sanity'

export default defineField({
  name: 'inventory',
  title: 'Inventory',
  type: 'object',
  options: {
    columns: 3,
  },
  fields: [
    // Available
    {
      name: 'isAvailable',
      title: 'Available',
      type: 'boolean',
    },
    // Management
    {
      name: 'management',
      title: 'Management',
      type: 'string',
    },
    // Policy
    {
      name: 'policy',
      title: 'Policy',
      type: 'string',
    },
  ],
})
