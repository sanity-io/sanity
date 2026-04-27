import {type Config, defineArrayMember, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'bio', type: 'text'}),
    defineField({name: 'image', type: 'image'}),
  ],
})

const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'description', type: 'text'}),
  ],
})

const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
    defineField({
      name: 'categories',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
    }),
    defineField({name: 'publishedAt', type: 'datetime'}),
    defineField({name: 'mainImage', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({name: 'excerpt', type: 'text'}),
  ],
})

export const blog = {
  name: 'blog',
  title: 'Blog',
  plugins: [structureTool()],
  schema: {
    types: [post, author, category],
  },
} satisfies Partial<Config>
