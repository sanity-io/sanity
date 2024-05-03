import {defineField, defineType} from 'sanity'

const animal = defineField({
  type: 'object',
  name: 'animal',
  title: 'Animal',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Animal name',
    },
    {
      name: 'countries',
      type: 'array',
      title: 'Countries',
      of: [
        {
          type: 'string',
          title: 'Country',
        },
      ],
    },
    {
      type: 'array',
      name: 'friends',
      of: [
        {
          type: 'object',
          name: 'friend',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Friend name',
            },
          ],
        },
      ],
    },
  ],
})

const animals = defineField({
  type: 'array',
  name: 'animals',
  title: 'Animals',
  of: [animal],
})

export const objectsDebug = defineType({
  type: 'document',
  name: 'objectsDebug',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    animals,
  ],
})
