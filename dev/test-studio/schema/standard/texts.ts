// import {MdFormatAlignLeft as icon} from 'react-icons/md'

import {defineType} from 'sanity'

export default defineType({
  name: 'textsTest',
  type: 'document',
  title: 'Texts tests',
  // icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      description: "NOT a text field (it's a string!)",
    },
    {
      name: 'simple',
      type: 'text',
      title: 'Simple text',
      description: 'This is a simple text field',
    },
    {
      name: 'rows2',
      type: 'text',
      title: '2 rows text',
      description: 'This is a simple text field',
      rows: 2,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'rows15',
      type: 'text',
      title: '15 rows text',
      description: 'This is a simple text field',
      rows: 15,
    },
    {
      name: 'readonlyField',
      type: 'text',
      title: 'A read only text',
      description: 'It may have a value, but it cannot be edited',
      readOnly: true,
    },
  ],
})
