import {FilterIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  title: 'Collection rule',
  name: 'collectionRule',
  type: 'object',
  icon: FilterIcon,
  readOnly: true,
  fields: [
    // Column
    defineField({
      title: 'Column',
      name: 'column',
      type: 'string',
    }),
    // Values
    defineField({
      title: 'Relation',
      name: 'relation',
      type: 'string',
    }),
    // Condition
    defineField({
      title: 'Condition',
      name: 'condition',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      condition: 'condition',
      name: 'column',
      relation: 'relation',
    },
    prepare(selection) {
      const {condition, name, relation} = selection

      return {
        subtitle: `${relation} ${condition}`,
        title: name,
      }
    },
  },
})
