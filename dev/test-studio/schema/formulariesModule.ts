import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {TagIcon} from '@sanity/icons/Tag'
import {defineArrayMember, defineField, defineType} from 'sanity'

const yesNo = [
  {title: 'Yes', value: 'Yes'},
  {title: 'No', value: 'No'},
]

export const formulary = defineType({
  name: 'formulary',
  title: 'Formulary',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
    }),
    defineField({
      name: 'paRequired',
      title: 'Prior authorization required',
      type: 'string',
      options: {list: yesNo, layout: 'radio'},
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity limit',
      type: 'string',
      options: {list: yesNo, layout: 'radio'},
    }),
    defineField({
      name: 'specialty',
      title: 'Specialty',
      type: 'string',
      options: {list: yesNo, layout: 'radio'},
    }),
  ],
  preview: {
    select: {
      title: 'name',
      tier: 'tier',
    },
    prepare({title, tier}) {
      return {
        title,
        subtitle: tier ? `Tier ${tier}` : undefined,
      }
    },
  },
})

export const formulariesModule = defineType({
  name: 'formulariesModule',
  title: 'Formularies module',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'formularies',
      title: 'Formularies',
      type: 'array',
      of: [defineArrayMember({type: 'formulary'})],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
