import {defineField, defineType, type ItemProps} from 'sanity'

const inlineObject = defineField({
  type: 'array',
  name: 'arrayInlineObject',
  title: 'List of Physical Attributes',
  of: [
    {
      type: 'object',
      name: 'myObject',
      title: 'My object',
      components: {
        item: (props: ItemProps) => (
          <div style={{border: '1px solid orange', padding: 4, boxSizing: 'border-box'}}>
            {props.children}
          </div>
        ),
      },
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
        },
      ],
    },
  ],
})

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
      type: 'array',
      name: 'description',
      title: 'Description',
      of: [
        {type: 'block'},
        {
          type: 'object',
          name: 'info',
          fields: [
            {
              type: 'array',
              name: 'item',
              title: 'Item',
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
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      type: 'string',
                      name: 'value',
                      title: 'Value',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
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
                    {
                      name: 'exceptionArray',
                      title: 'Exception array',
                      type: 'array',
                      of: [
                        {
                          type: 'object',
                          name: 'exceptionArray',
                          title: 'Exception array',
                          fields: [
                            {
                              type: 'string',
                              name: 'title',
                              title: 'Title',
                            },
                            {
                              name: 'properties_c',
                              type: 'array',
                              title: 'Friend properties',
                              of: [
                                {
                                  type: 'object',
                                  name: 'property_d',
                                  title: 'Property',
                                  fields: [
                                    {
                                      type: 'string',
                                      name: 'title',
                                      title: 'Title',
                                    },
                                    {
                                      name: 'properties_d',
                                      type: 'array',
                                      title: 'Friend properties',
                                      of: [
                                        {
                                          type: 'object',
                                          name: 'property_b',
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
    },
    {
      type: 'array',
      name: 'enemies',
      of: [
        {
          type: 'object',
          name: 'enemy',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Enemy name',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'age',
              type: 'number',
              title: 'Enemy age',
            },
            {
              name: 'properties',
              type: 'array',
              title: 'Enemy properties',
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
    inlineObject,
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

const pte = defineField({
  name: 'pte',
  type: 'object',
  title: 'PTE',
  fields: [
    {
      type: 'array',
      name: 'body',
      of: [{type: 'block'}, animal],
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

const arrayOfFiles = defineField({
  type: 'array',
  name: 'arrayOfFiles',
  title: 'Array of files',
  of: [
    {
      type: 'file',
      name: 'file',
      title: 'File',
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
    pte,
    {
      type: 'object',
      name: 'myObject',
      fields: [
        {
          name: 'string',
          type: 'string',
          title: 'String',
        },
        // Array of objects
        {
          name: 'arrayOfObjects',
          type: 'array',
          title: 'Array of objects',
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
              type: 'reference',
              name: 'author',
              title: 'Author',
              to: [{type: 'author'}],
            },
          ],
        },
      ],
    },
    {
      type: 'image',
      name: 'image',
      title: 'Image',
    },
    {
      name: 'author',
      type: 'reference',
      title: 'Author',
      to: [{type: 'author'}],
    },
    {
      type: 'object',
      name: 'mixedObject',
      title: 'Mixed object',
      fields: [
        {
          name: 'author',
          type: 'reference',
          title: 'Author',
          to: [{type: 'author'}],
        },
      ],
      preview: {
        select: {
          title: 'author.name',
        },
        prepare({title}) {
          return {
            title,
          }
        },
      },
    },
  ],
})

const arrayOfObjectException = defineField({
  type: 'array',
  name: 'arrayOfObjectException',
  title: 'Array of object exception',
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
    arrayOfMixedTypes,
    body,
    objectWithArray,
    arrayOfAnonymousObjects,
    arrayOfImages,
    arrayOfFiles,
    arrayOfObjectException,
    inlineObject,
  ],
})
