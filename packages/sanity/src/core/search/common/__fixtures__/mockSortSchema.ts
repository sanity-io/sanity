import {Schema} from '@sanity/schema'
import {type SchemaType} from '@sanity/types'

const mockSortSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {
          name: 'bestFriend',
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
    {
      name: 'editor',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'editorOnlyField', type: 'string'},
      ],
    },
    {
      name: 'arrayMember',
      type: 'document',
      fields: [{name: 'value', type: 'string'}],
    },
    {
      name: 'book',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'publicationYear', type: 'number'},
        {
          name: 'translations',
          type: 'object',
          fields: [
            {name: 'se', type: 'string'},
            {name: 'no', type: 'string'},
          ],
        },
        {
          name: 'author',
          type: 'reference',
          to: [{type: 'author'}],
        },
        {
          name: 'contributor',
          type: 'reference',
          to: [{type: 'author'}, {type: 'editor'}],
        },
        {
          name: 'coverImage',
          type: 'object',
          fields: [
            {
              name: 'asset',
              type: 'reference',
              to: [{type: 'sanity.imageAsset'}],
            },
          ],
        },
      ],
    },
    {
      name: 'sanity.imageAsset',
      type: 'document',
      fields: [{name: 'size', type: 'number'}],
    },
    {
      name: 'withArrays',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {
          name: 'items',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'arrayMember'}]}],
        },
        {
          name: 'tags',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [{name: 'label', type: 'string'}],
            },
          ],
        },
        {
          name: 'mixed',
          type: 'array',
          of: [{type: 'string'}, {type: 'number'}],
        },
      ],
    },
  ],
})

/** @internal */
export const bookType = mockSortSchema.get('book') as SchemaType

/** @internal */
export const withArraysType = mockSortSchema.get('withArrays') as SchemaType
