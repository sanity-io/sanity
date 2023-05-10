import {defineType} from 'sanity'
import {defineArrayMember, defineField} from '@sanity/types'

export const i18nArray = defineType({
  type: 'array',
  name: 'i18nArray',
  title: 'i18n Array',

  of: [defineArrayMember({type: 'book'}), defineArrayMember({type: 'author'})],
})

export const i18nRef = defineType({
  type: 'reference',
  name: 'i18nRef',
  title: 'i18n ref',

  to: [{type: 'book'}, {type: 'author'}],
})

export const i18nDocument = defineType({
  type: 'document',
  name: 'i18nDocument',
  title: 'Debug: i18n document',

  fieldsets: [{name: 'fieldset', title: 'Fieldset'}],
  groups: [{name: 'group', title: 'Group'}],

  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      description: 'Description',
    }),
    defineField({
      type: i18nArray.name,
      name: 'array',
      title: 'Array',
      description: 'Description',
      fieldset: 'fieldset',
    }),
    defineField({
      type: i18nRef.name,
      name: 'ref',
      title: 'Ref',
      description: 'Description',
      group: 'group',
    }),
  ],
})
