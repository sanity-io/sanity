import {defineField} from 'sanity'

export default {
  name: 'house',
  title: 'House',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    defineField({
      type: 'array',
      name: 'house',
      title: 'House',
      of: [
        {
          type: 'object',
          name: 'room',
          title: 'Room',
          fields: [
            defineField({type: 'string', name: 'name', title: 'Name'}),
            defineField({
              type: 'array',
              name: 'furnitureList',
              title: 'List furniture in the room',
              validation: (Rule) => {
                return Rule.custom((value) => {
                  if (!value || value.length === 0) {
                    return 'Room cant be unfurnished!'
                  }
                  return true
                })
              },
              of: [
                {
                  type: 'object',
                  name: 'furniture',
                  title: 'Furniture description',
                  fields: [
                    defineField({
                      type: 'array',
                      name: 'richText',
                      title: 'Tekst',
                      of: [{type: 'block'}],
                    }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'selfRef',
      type: 'reference',
      to: [{type: 'referenceTest'}],
    }),
  ],
}
