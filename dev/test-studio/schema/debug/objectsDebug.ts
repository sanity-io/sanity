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
      name: 'size',
      type: 'object',
      title: 'Size',
      fields: [
        {
          name: 'width',
          type: 'number',
          title: 'Width',
        },
        {
          name: 'height',
          type: 'number',
          title: 'Height',
        },
      ],
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
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'age',
              type: 'number',
              title: 'Friend age',
            },
            {
              name: 'properties',
              type: 'array',
              title: 'Friend properties',
              of: [
                {
                  type: 'object',
                  name: 'property',
                  title: 'Property',
                  fields: [
                    {
                      type: 'string',
                      name: 'title',
                      title: 'Title',
                    },
                  ],
                },
              ],
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

const arrayOfImages = defineField({
  type: 'array',
  name: 'arrayOfImages',
  title: 'Array of images',
  of: [
    {
      type: 'image',
      name: 'image',
      title: 'Image',
    },
  ],
})

const arrayOfAnonymousObjects = defineField({
  type: 'array',
  name: 'arrayOfAnonymousObjects',
  title: 'Array of anonymous objects',
  of: [
    {
      type: 'object',
      fields: [
        {
          name: 'anonymousString',
          type: 'string',
          title: 'Anonymous string',
        },
      ],
    },
  ],
})

const objectWithArray = defineField({
  type: 'object',
  name: 'objectWithArray',
  title: 'Object with array',
  fields: [
    {
      type: 'array',
      name: 'animalss',
      title: 'Animals',
      of: [animal],
    },
  ],
})

const arrayOfMixedTypes = defineField({
  type: 'array',
  name: 'arrayOfMixedTypes',
  title: 'Array of mixed types',
  of: [
    {
      type: 'object',
      name: 'myObject',
      fields: [
        {
          name: 'string',
          type: 'string',
          title: 'String',
        },
      ],
    },
    {
      type: 'image',
      name: 'image',
      title: 'Image',
    },
  ],
})

const body = defineField({
  type: 'array',
  name: 'body',
  title: 'Body',
  of: [
    {
      type: 'block',
      name: 'block',
      title: 'Block',
    },
    animal,
  ],
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
    body,
    objectWithArray,
    arrayOfAnonymousObjects,
    arrayOfImages,
    arrayOfMixedTypes,
  ],
})
