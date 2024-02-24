import {defineArrayMember, defineField, defineType} from 'sanity'

export default [
  defineType({
    name: 'post',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
        options: {source: 'title', maxLength: 96},
      }),
      defineField({name: 'description', type: 'text'}),
      defineField({
        name: 'image',
        type: 'image',
        options: {hotspot: true},
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'author',
        type: 'reference',
        to: [{type: 'author'}],
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'content',
        type: 'array',
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            type: 'image',
            options: {hotspot: true},
            fields: [{type: 'string', name: 'caption'}],
          }),
        ],
      }),
      defineField({
        name: 'tags',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
      }),
      defineField({
        name: 'category',
        type: 'reference',
        to: [{type: 'category'}],
        validation: (rule) => rule.required(),
      }),
    ],
  }),
  defineType({
    name: 'category',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
      }),
      defineField({name: 'description', type: 'text'}),
    ],
  }),
  defineType({
    name: 'author',
    type: 'document',
    fields: [
      defineField({
        name: 'name',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
        options: {source: 'name', maxLength: 96},
      }),
      defineField({
        name: 'email',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'avatar',
        type: 'image',
        options: {hotspot: true},
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'bio',
        type: 'array',
        of: [defineArrayMember({type: 'block'})],
      }),
    ],
  }),
]
