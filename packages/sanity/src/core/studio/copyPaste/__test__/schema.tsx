import {defineArrayMember, defineField, defineType, type Schema} from '@sanity/types'

import {createSchema} from '../../../schema'

const linkType = defineType({
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    },
  ],
  validation: (Rule) => Rule.required(),
})

const myStringObjectType = defineType({
  type: 'object',
  name: 'myStringObject',
  fields: [{type: 'string', name: 'myString', validation: (Rule) => Rule.required()}],
})

const nestedObjectType = defineType({
  type: 'object',
  name: 'nestedObject',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      type: 'array',
      name: 'objectList',
      of: [{type: 'nestedObject'}],
    },
    {
      type: 'object',
      name: 'recursiveTest',
      fields: [
        {
          name: 'recursive',
          type: 'nestedObject',
        },
      ],
    },
  ],
})

export const schema = createSchema({
  name: 'default',
  types: [
    linkType,
    myStringObjectType,
    nestedObjectType,
    {
      name: 'customNamedBlock',
      type: 'block',
      title: 'A named custom block',
      marks: {
        annotations: [linkType, myStringObjectType],
      },
      of: [
        {
          type: 'object',
          name: 'test',
          fields: [myStringObjectType],
        },
        {
          type: 'reference',
          name: 'strongAuthorRef',
          title: 'A strong author ref',
          to: {type: 'author'},
        },
      ],
    },
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'uniqueStringNotInOtherDocument',
          type: 'string',
        },
        {
          name: 'isVerified',
          type: 'boolean',
        },
        {
          name: 'born',
          type: 'number',
        },
        {
          name: 'favoriteNumbers',
          type: 'array',
          of: [{type: 'number'}],
        },
        {
          name: 'testNumberWithListObjects',
          title: 'Test Number - List Objects',
          type: 'number',
          options: {
            list: [
              {value: 1, title: 'One'},
              {value: 2, title: 'Two'},
            ],
          },
        },
        {type: 'image', name: 'profileImage'},
        {
          type: 'object',
          name: 'socialLinks',
          fields: [
            {type: 'string', name: 'twitter'},
            {type: 'string', name: 'linkedin'},
          ],
        },
        {
          name: 'nestedTest',
          type: 'nestedObject',
        },
        {
          name: 'bio',
          type: 'array',
          of: [
            {type: 'customNamedBlock'},
            {type: 'myStringObject'},
            {type: 'reference', to: [{type: 'author'}]},
          ],
        },
        {
          name: 'friends',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'author'}]}],
        },
        {
          name: 'bestFriend',
          type: 'reference',
          weak: true,
          to: [{type: 'author'}],
        },
      ],
    },
    {
      name: 'editor',
      title: 'Editor',
      type: 'document',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'isVerified',
          type: 'boolean',
        },
        {
          name: 'born',
          type: 'number',
        },
        {type: 'image', name: 'profileImage'},
        {type: 'image', name: 'profileImagePNG', options: {accept: 'image/png'}},
        {type: 'image', name: 'profileImageJpeg', options: {accept: 'image/jpeg'}},
        {type: 'file', name: 'profileCV'},
        {
          name: 'bio',
          type: 'array',
          of: [{type: 'customNamedBlock'}],
        },
        {
          name: 'favoriteNumbers',
          type: 'array',
          of: [{type: 'number'}],
        },
        {
          name: 'favoriteStrings',
          type: 'array',
          of: [{type: 'string'}],
        },
        {
          name: 'favoriteBooleans',
          type: 'array',
          of: [{type: 'boolean'}],
        },
        {
          name: 'testNumberWithListObjects',
          title: 'Test Number - List Objects',
          type: 'number',
          options: {
            list: [
              {value: 1, title: 'One'},
              {value: 2, title: 'Two'},
            ],
          },
        },
        {
          name: 'nestedTest',
          type: 'nestedObject',
        },
        {
          name: 'profile',
          type: 'object',
          fields: [
            {type: 'string', name: 'email'},
            {type: 'boolean', name: 'isFavorite'},
            {type: 'image', name: 'avatar'},
            {
              type: 'object',
              name: 'social',
              fields: [
                {type: 'string', name: 'twitter'},
                {type: 'string', name: 'linkedin'},
              ],
            },
          ],
        },
        {
          name: 'friends',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'editor'}, {type: 'author'}]}],
        },
        {
          name: 'bestAuthorFriend',
          type: 'reference',
          weak: false,
          to: [{type: 'author'}],
        },
        {
          name: 'relatedEditor',
          type: 'reference',
          weak: false,
          to: [{type: 'editor'}],
        },
        defineField({
          name: 'arrayWithAnonymousObject',
          title: 'Array with anonymous objects',
          description: 'This array contains objects of type as defined inline',
          type: 'array',
          of: [
            {
              type: 'object',
              title: 'Something',
              fields: [
                {name: 'first', type: 'string', title: 'First string'},
                {name: 'second', type: 'string', title: 'Second string'},
              ],
            },
          ],
        }),
        defineField({
          name: 'arrayOfPredefinedOptions',
          title: 'Array of predefined options',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'color',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                },
                {
                  name: 'name',
                  type: 'string',
                },
              ],
            },
          ],
          options: {
            list: [
              {_type: 'color', title: 'Red', name: 'red'},
              {_type: 'color', title: 'Green', name: 'green', _key: 'green'},
              {_type: 'color', title: 'Blue', name: 'blue', _key: 'blue'},
              {_type: 'color', title: 'Black', name: 'black', _key: 'black'},
            ],
          },
        }),
        {
          name: 'arrayOfMultipleTypes',
          title: 'Array of multiple types',
          type: 'array',
          of: [
            {
              type: 'image',
            },
            {
              type: 'object',
              name: 'color',
              title: 'Color with a long title',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                },
                {
                  name: 'name',
                  type: 'string',
                },
              ],
            },
          ],
        },
        defineField({
          name: 'arrayOfMultipleNestedTypes',
          title: 'Array of multiple nested types',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'image',
            }),
            defineArrayMember({
              type: 'object',
              name: 'color',
              title: 'Color with a long title',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                },
                {
                  name: 'name',
                  type: 'string',
                },
                defineField({
                  name: 'nestedArray',
                  title: 'Nested array',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'object',
                      name: 'color',
                      title: 'Nested color with a long title',
                      fields: [
                        {
                          name: 'title',
                          type: 'string',
                        },
                        {
                          name: 'name',
                          type: 'string',
                        },
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
    {
      name: 'post',
      title: 'Post',
      type: 'document',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'body',
          type: 'array',
          of: [{type: 'customNamedBlock'}],
        },
        {
          name: 'author',
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
  ],
}) as Schema
