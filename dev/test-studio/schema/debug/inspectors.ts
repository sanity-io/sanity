import {SearchIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const inspectorsTestType = defineType({
  type: 'document',
  name: 'inspectorsTest',
  title: 'Inspectors test',
  icon: SearchIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'name',
      title: 'Name',
    }),
  ],
})
