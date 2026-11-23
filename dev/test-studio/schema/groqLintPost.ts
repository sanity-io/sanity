import {CommentIcon} from '@sanity/icons/Comment'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'

/**
 * Document types the GROQ Lint Playground sample queries read (`post`, `category`,
 * and the references those queries follow). Vision checks filters, `order()` and
 * dereferences, so fields the queries touch are declared here even when the
 * playground's own schema lists `author` as a plain string.
 */
export const groqLintCategory = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: DocumentsIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({name: 'slug', title: 'Slug', type: 'string'}),
  ],
})

export const groqLintTag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  icon: TagIcon,
  fields: [defineField({name: 'name', title: 'Name', type: 'string'})],
})

export const groqLintComment = defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
    }),
    defineField({
      name: 'replies',
      title: 'Replies',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'comment'}]}],
    }),
    defineField({
      name: 'parent',
      title: 'Parent',
      type: 'reference',
      to: [{type: 'post'}],
    }),
  ],
})

export const groqLintPost = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'text'}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
    }),
    defineField({name: 'published', title: 'Published', type: 'boolean'}),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'category'}]}],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
    }),
    defineField({
      name: 'related',
      title: 'Related',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'post'}]}],
    }),
    defineField({
      name: 'comments',
      title: 'Comments',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'comment'}]}],
    }),
    defineField({name: 'startDate', title: 'Start date', type: 'datetime'}),
    defineField({name: 'endDate', title: 'End date', type: 'datetime'}),
    defineField({name: 'firstName', title: 'First name', type: 'string'}),
    defineField({name: 'lastName', title: 'Last name', type: 'string'}),
  ],
})

export const groqLintPlaygroundTypes = [
  groqLintPost,
  groqLintCategory,
  groqLintTag,
  groqLintComment,
]
