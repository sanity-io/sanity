import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {countField, summaryField} from './shared'

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
    defineField({
      name: 'versionGroups',
      title: 'Releases',
      description: 'The games grouped the way they were released, for example “Red / Blue”.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'newTypes',
      title: 'New types',
      // Plain names rather than references: types reference their generation, and the seed
      // script prunes types before generations.
      description: 'The types introduced in this generation.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    summaryField(),
    countField('pokemonCount', 'New Pokémon', 'How many species this generation introduced.'),
    countField('moveCount', 'New moves', 'How many moves this generation introduced.'),
    countField('abilityCount', 'New abilities', 'How many abilities this generation introduced.'),
  ],
  orderings: [{title: 'Number', name: 'numberAsc', by: [{field: 'number', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', region: 'region'},
    prepare: ({title, region}) => ({title, subtitle: region ? `${region} region` : undefined}),
  },
})
