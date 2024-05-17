import {defineField, defineType, type Rule} from 'sanity'

export const hotspot = defineType({
  name: 'hotspot',
  type: 'object',
  fieldsets: [{name: 'position', options: {columns: 2}}],
  fields: [
    {name: 'details', type: 'text', rows: 2},
    {
      name: 'x',
      type: 'number',
      readOnly: true,
      fieldset: 'position',
      initialValue: 50,
      validation: (Rule: Rule) => Rule.required().min(0).max(100),
    },
    {
      name: 'y',
      type: 'number',
      readOnly: true,
      fieldset: 'position',
      initialValue: 50,
      validation: (Rule: Rule) => Rule.required().min(0).max(100),
    },
  ],
  preview: {
    select: {
      title: 'details',
      x: 'x',
      y: 'y',
    },
    prepare({title, x, y}: any) {
      return {
        title,
        subtitle: x && y ? `${x}% x ${y}%` : `No position set`,
      }
    },
  },
})

export const hotspotArrayTest = defineType({
  name: 'hotspotArrayTest',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'featureImage', type: 'image'}),
    defineField({
      name: 'hotspots',
      type: 'array',
      of: [{type: 'hotspot'}],
      options: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore nbd
        imageHotspot: {
          imagePath: 'featureImage',
          descriptionPath: 'details',
        },
      },
    }),
  ],
})
