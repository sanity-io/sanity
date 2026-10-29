import {type SchemaTypeDefinition} from 'sanity'

export const articleSchemaTypes = [
  {
    name: 'blockContent',
    type: 'array',
    of: [{type: 'block'}, {type: 'image'}, {type: 'columns'}, {type: 'hero'}],
  },
  {
    name: 'columns',
    type: 'object',
    fields: [
      {
        name: 'columns',
        type: 'array',
        of: [
          {
            type: 'object',
            fields: [
              {name: 'title', type: 'string'},
              {name: 'content', type: 'blockContent'},
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'hero',
    type: 'object',
    fields: [
      {name: 'image', type: 'image'},
      {name: 'body', type: 'blockContent'},
    ],
  },
  {
    name: 'seo',
    type: 'object',
    fields: [
      {
        name: 'slug',
        type: 'slug',
        description: 'Defines the part of the URL that uniquely defines this entity from others.',
        validation: (rule) => rule.required(),
      },
      {name: 'metaTitle', type: 'string'},
      {name: 'metaDescription', type: 'text'},
      {name: 'excludeFromSearchEngines', type: 'boolean'},
    ],
  },
  {
    name: 'article',
    type: 'document',
    fields: [
      {name: 'title', type: 'string'},
      {name: 'description', type: 'string'},
      {name: 'mainImage', type: 'image'},
      {name: 'author', type: 'reference', to: [{type: 'author'}]},
      {name: 'body', type: 'blockContent'},
      {name: 'excerpt', type: 'blockContent'},
      {
        name: 'categories',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'category'}]}],
      },
      {name: 'tags', type: 'array', of: [{type: 'string'}]},
      {name: 'seo', title: 'SEO Fields', type: 'seo'},
    ],
  },
  {
    name: 'author',
    type: 'document',
    fields: [
      {name: 'name', type: 'string'},
      {name: 'profilePicture', type: 'image'},
      {name: 'bio', type: 'blockContent'},
    ],
  },
  {
    name: 'category',
    type: 'document',
    fields: [
      {name: 'name', type: 'string'},
      {name: 'image', type: 'image'},
    ],
  },
] satisfies SchemaTypeDefinition[]
