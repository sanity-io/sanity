import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'button',
  type: 'object',
  description: 'The button of the call to action',
  fields: [
    defineField({
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
    }),
    defineField({
      name: 'link',
      title: 'Button Link',
      type: 'link',
      options: {collapsible: true, collapsed: false},
    }),
  ],
  options: {collapsible: true},
})
