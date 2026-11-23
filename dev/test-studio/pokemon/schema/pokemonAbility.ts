import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'

export const pokemonAbility = defineType({
  name: 'pokemonAbility',
  title: 'Ability',
  type: 'document',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'generation',
      title: 'Introduced in',
      type: 'reference',
      to: [{type: 'pokemonGeneration'}],
      options: {disableNew: true},
    }),
    defineField({
      name: 'shortEffect',
      title: 'Short effect',
      type: 'string',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'effect',
      title: 'Effect',
      description: 'The full in-battle and overworld effect of the ability.',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'flavorText',
      title: 'Flavor text',
      description: 'The in-game description from the most recent game that has one.',
      type: 'text',
      rows: 2,
    }),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', shortEffect: 'shortEffect', flavorText: 'flavorText'},
    prepare: ({title, shortEffect, flavorText}) => ({
      title,
      subtitle: shortEffect || flavorText,
    }),
  },
})
