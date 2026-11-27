import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'

import {countField, flavorTextEntriesField, summaryField} from './shared'

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
      name: 'isMainSeries',
      title: 'Main series',
      description: 'Off when the ability only exists in spin-off games.',
      type: 'boolean',
      initialValue: true,
    }),
    summaryField(),
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
    flavorTextEntriesField('Each unique English description, with every game that uses it.'),
    countField('pokemonCount', 'Pokémon', 'How many Pokémon (including forms) can have it.'),
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
