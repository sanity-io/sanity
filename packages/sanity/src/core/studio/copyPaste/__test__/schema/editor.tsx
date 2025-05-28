import {defineField, defineType} from '@sanity/types'

import {arrayOfMultipleNestedTypes, arrayOfMultipleNestedTypesWithoutColor} from './objects'

export const editorDocument = defineType({
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
    }),
    defineField({
      type: 'myStringObject',
      name: 'myStringObject',
      title: 'My string object',
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
        {
          type: 'myStringObject',
          name: 'myStringObject',
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
    defineField({
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
    }),
    arrayOfMultipleNestedTypes,
    arrayOfMultipleNestedTypesWithoutColor,
  ],
})
