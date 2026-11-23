import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const pokemonGeneration = defineType({
  name: 'pokemonGeneration',
  title: 'Generation',
  type: 'document',
  icon: EarthGlobeIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'number',
      title: 'Number',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'region',
      title: 'Main region',
      description: 'The region the games of this generation take place in.',
      type: 'string',
    }),
    defineField({
      name: 'games',
      title: 'Games',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
  ],
  orderings: [{title: 'Number', name: 'numberAsc', by: [{field: 'number', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', region: 'region'},
    prepare: ({title, region}) => ({title, subtitle: region ? `${region} region` : undefined}),
  },
})
