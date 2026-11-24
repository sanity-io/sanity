import {TargetIcon} from '@sanity/icons/Target'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {MOVE_CATEGORIES, MOVE_DAMAGE_CLASSES, MOVE_TARGETS, STAT_NAMES} from '../constants'
import {countField, flavorTextEntriesField, summaryField} from './shared'

const STAT_CHANGE_STATS = [
  ...STAT_NAMES.filter((stat) => stat.name !== 'hp').map((stat) => ({
    title: stat.title,
    value: stat.apiName,
  })),
  {title: 'Accuracy', value: 'accuracy'},
  {title: 'Evasion', value: 'evasion'},
]

function percentField(name: string, title: string, description?: string) {
  return defineField({
    name,
    title,
    description,
    type: 'number',
    fieldset: 'effects',
    validation: (rule) => rule.integer().min(0).max(100),
  })
}

export const pokemonStatChange = defineType({
  name: 'pokemonStatChange',
  title: 'Stat change',
  type: 'object',
  fields: [
    defineField({
      name: 'stat',
      title: 'Stat',
      type: 'string',
      options: {list: STAT_CHANGE_STATS},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'change',
      title: 'Stages',
      description: 'Positive raises the stat, negative lowers it.',
      type: 'number',
      validation: (rule) => rule.required().integer().min(-6).max(6),
    }),
  ],
  preview: {
    select: {stat: 'stat', change: 'change'},
    prepare: ({stat, change}) => ({
      title: `${STAT_CHANGE_STATS.find((option) => option.value === stat)?.title ?? stat} ${change > 0 ? `+${change}` : change}`,
    }),
  },
})

export const pokemonMove = defineType({
  name: 'pokemonMove',
  title: 'Move',
  type: 'document',
  icon: TargetIcon,
  fieldsets: [
    {name: 'battle', title: 'Battle', options: {columns: 3}},
    {
      name: 'effects',
      title: 'Secondary effects',
      description: 'Chances are percentages; drain and healing are a share of the damage or HP.',
      options: {columns: 3},
    },
    {name: 'hits', title: 'Hits per use', options: {columns: 2}},
  ],
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
      name: 'type',
      title: 'Type',
      type: 'reference',
      to: [{type: 'pokemonType'}],
      options: {disableNew: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'damageClass',
      title: 'Damage class',
      type: 'string',
      options: {list: MOVE_DAMAGE_CLASSES, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'generation',
      title: 'Introduced in',
      type: 'reference',
      to: [{type: 'pokemonGeneration'}],
      options: {disableNew: true},
    }),
    summaryField(),
    defineField({
      name: 'power',
      title: 'Power',
      type: 'number',
      fieldset: 'battle',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'accuracy',
      title: 'Accuracy (%)',
      description: 'Empty for moves that never miss.',
      type: 'number',
      fieldset: 'battle',
      validation: (rule) => rule.integer().min(0).max(100),
    }),
    defineField({
      name: 'pp',
      title: 'PP',
      type: 'number',
      fieldset: 'battle',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      description: 'Moves with higher priority go first.',
      type: 'number',
      fieldset: 'battle',
      validation: (rule) => rule.integer().min(-8).max(8),
    }),
    defineField({
      name: 'critRate',
      title: 'Critical hit stage',
      type: 'number',
      fieldset: 'battle',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'target',
      title: 'Target',
      type: 'string',
      fieldset: 'battle',
      options: {list: MOVE_TARGETS},
    }),
    defineField({
      name: 'shortEffect',
      title: 'Short effect',
      type: 'string',
    }),
    defineField({
      name: 'effect',
      title: 'Effect',
      description: 'The full in-battle effect of the move.',
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
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {list: MOVE_CATEGORIES},
    }),
    defineField({
      name: 'ailment',
      title: 'Status condition',
      description: 'For example “paralysis” or “sleep”.',
      type: 'string',
    }),
    percentField('effectChance', 'Effect chance'),
    percentField('ailmentChance', 'Status chance'),
    percentField('flinchChance', 'Flinch chance'),
    percentField('statChance', 'Stat change chance'),
    defineField({
      name: 'drain',
      title: 'Drain (%)',
      description: 'Positive heals the user by a share of the damage, negative is recoil.',
      type: 'number',
      fieldset: 'effects',
      validation: (rule) => rule.integer().min(-100).max(100),
    }),
    percentField('healing', 'Healing (%)', 'A share of the user’s maximum HP.'),
    defineField({
      name: 'minHits',
      title: 'Minimum hits',
      type: 'number',
      fieldset: 'hits',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'maxHits',
      title: 'Maximum hits',
      type: 'number',
      fieldset: 'hits',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'statChanges',
      title: 'Stat changes',
      type: 'array',
      of: [defineArrayMember({type: 'pokemonStatChange'})],
    }),
    countField('learnedByCount', 'Learned by', 'How many Pokémon can learn this move.'),
  ],
  orderings: [
    {title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
    {title: 'Most powerful', name: 'powerDesc', by: [{field: 'power', direction: 'desc'}]},
    {
      title: 'Most common',
      name: 'learnedByDesc',
      by: [{field: 'learnedByCount', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'name',
      type: 'type.name',
      media: 'type.icon',
      damageClass: 'damageClass',
      power: 'power',
      shortEffect: 'shortEffect',
    },
    prepare: ({title, type, media, damageClass, power, shortEffect}) => ({
      title,
      subtitle: [
        type,
        MOVE_DAMAGE_CLASSES.find((option) => option.value === damageClass)?.title,
        typeof power === 'number' && `Power ${power}`,
      ]
        .filter(Boolean)
        .join(' · '),
      description: shortEffect,
      media,
    }),
  },
})
