import {defineArrayMember, defineField, defineType, getPublishedId} from 'sanity'

import {
  EGG_GROUPS,
  EVOLUTION_TRIGGERS,
  GROWTH_RATES,
  POKEMON_COLORS,
  POKEMON_HABITATS,
  POKEMON_SHAPES,
} from '../constants'
import {PokeballIcon} from '../PokeballIcon'

const STATS = [
  {name: 'hp', title: 'HP'},
  {name: 'attack', title: 'Attack'},
  {name: 'defense', title: 'Defense'},
  {name: 'specialAttack', title: 'Sp. Atk'},
  {name: 'specialDefense', title: 'Sp. Def'},
  {name: 'speed', title: 'Speed'},
] as const

export function formatDexNumber(number: number | undefined): string {
  return typeof number === 'number' ? `#${String(number).padStart(4, '0')}` : '#????'
}

function triggerTitle(trigger: string | undefined) {
  return EVOLUTION_TRIGGERS.find((option) => option.value === trigger)?.title
}

export const pokemonBaseStats = defineType({
  name: 'pokemonBaseStats',
  title: 'Base stats',
  type: 'object',
  options: {columns: 3},
  fields: STATS.map((stat) =>
    defineField({
      name: stat.name,
      title: stat.title,
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(255),
    }),
  ),
  preview: {
    select: Object.fromEntries(STATS.map((stat) => [stat.name, stat.name])),
    prepare: (stats: Record<string, number | undefined>) => ({
      title: `Total ${STATS.reduce((total, stat) => total + (stats[stat.name] ?? 0), 0)}`,
      subtitle: STATS.map((stat) => `${stat.title} ${stats[stat.name] ?? '–'}`).join(' · '),
    }),
  },
})

export const pokemonAbilitySlot = defineType({
  name: 'pokemonAbilitySlot',
  title: 'Ability',
  type: 'object',
  fields: [
    defineField({
      name: 'ability',
      title: 'Ability',
      type: 'reference',
      to: [{type: 'pokemonAbility'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isHidden',
      title: 'Hidden ability',
      description:
        'Hidden abilities are only available through special means, like Ability Patches.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'ability.name', subtitle: 'ability.shortEffect', isHidden: 'isHidden'},
    prepare: ({title, subtitle, isHidden}) => ({
      title: isHidden ? `${title} (hidden)` : title,
      subtitle,
    }),
  },
})

export const pokemonEvolution = defineType({
  name: 'pokemonEvolution',
  title: 'Evolution',
  type: 'object',
  fields: [
    defineField({
      name: 'pokemon',
      title: 'Evolves into',
      type: 'reference',
      to: [{type: 'pokemon'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'trigger',
      title: 'Method',
      type: 'string',
      options: {list: EVOLUTION_TRIGGERS},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'minLevel',
      title: 'Level',
      type: 'number',
      hidden: ({parent}) => parent?.trigger !== 'level-up',
      validation: (rule) => rule.integer().min(1).max(100),
    }),
    defineField({
      name: 'item',
      title: 'Item',
      type: 'string',
      hidden: ({parent}) => parent?.trigger !== 'use-item' && parent?.trigger !== 'trade',
    }),
    defineField({
      name: 'condition',
      title: 'Condition',
      description: 'Any further requirement, for example “high friendship” or “at night”.',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      name: 'pokemon.name',
      media: 'pokemon.icon',
      trigger: 'trigger',
      minLevel: 'minLevel',
      item: 'item',
      condition: 'condition',
    },
    prepare: ({name, media, trigger, minLevel, item, condition}) => ({
      title: name ? `→ ${name}` : 'Missing Pokémon',
      subtitle: [minLevel ? `Level ${minLevel}` : triggerTitle(trigger), item, condition]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})

export const pokemon = defineType({
  name: 'pokemon',
  title: 'Pokémon',
  type: 'document',
  icon: PokeballIcon,
  groups: [
    {name: 'overview', title: 'Overview', default: true},
    {name: 'stats', title: 'Stats'},
    {name: 'abilities', title: 'Abilities'},
    {name: 'evolution', title: 'Evolution'},
    {name: 'breeding', title: 'Training & breeding'},
    {name: 'media', title: 'Media'},
  ],
  fieldsets: [
    {name: 'status', title: 'Status', options: {columns: 3}},
    {name: 'physical', title: 'Physical', options: {columns: 2}},
    {name: 'appearance', title: 'Appearance', options: {columns: 3}},
    {name: 'pokedexEntry', title: 'Pokédex entry'},
    {name: 'gender', title: 'Gender', options: {columns: 2}},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'overview',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'overview',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'nationalDexNumber',
      title: 'National Pokédex number',
      type: 'number',
      group: 'overview',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'genus',
      title: 'Category',
      description: 'For example “Seed Pokémon”.',
      type: 'string',
      group: 'overview',
    }),
    defineField({
      name: 'types',
      title: 'Types',
      type: 'array',
      group: 'overview',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'pokemonType'}],
          options: {disableNew: true},
        }),
      ],
      validation: (rule) => rule.required().min(1).max(2).unique(),
    }),
    defineField({
      name: 'generation',
      title: 'Generation',
      type: 'reference',
      group: 'overview',
      to: [{type: 'pokemonGeneration'}],
      options: {disableNew: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isBaby',
      title: 'Baby',
      type: 'boolean',
      group: 'overview',
      fieldset: 'status',
      initialValue: false,
    }),
    defineField({
      name: 'isLegendary',
      title: 'Legendary',
      type: 'boolean',
      group: 'overview',
      fieldset: 'status',
      initialValue: false,
    }),
    defineField({
      name: 'isMythical',
      title: 'Mythical',
      type: 'boolean',
      group: 'overview',
      fieldset: 'status',
      initialValue: false,
      validation: (rule) =>
        rule.custom((isMythical, {document}) =>
          isMythical && document?.isLegendary
            ? 'A Pokémon is either legendary or mythical, not both'
            : true,
        ),
    }),
    defineField({
      name: 'flavorText',
      title: 'Description',
      type: 'text',
      rows: 3,
      group: 'overview',
      fieldset: 'pokedexEntry',
    }),
    defineField({
      name: 'flavorTextGame',
      title: 'From',
      description: 'The game the description is taken from.',
      type: 'string',
      group: 'overview',
      fieldset: 'pokedexEntry',
    }),
    defineField({
      name: 'height',
      title: 'Height (m)',
      type: 'number',
      group: 'overview',
      fieldset: 'physical',
      validation: (rule) => rule.required().positive().precision(1),
    }),
    defineField({
      name: 'weight',
      title: 'Weight (kg)',
      type: 'number',
      group: 'overview',
      fieldset: 'physical',
      validation: (rule) => rule.required().positive().precision(1),
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      group: 'overview',
      fieldset: 'appearance',
      options: {list: POKEMON_COLORS},
    }),
    defineField({
      name: 'shape',
      title: 'Shape',
      type: 'string',
      group: 'overview',
      fieldset: 'appearance',
      options: {list: POKEMON_SHAPES},
    }),
    defineField({
      name: 'habitat',
      title: 'Habitat',
      type: 'string',
      group: 'overview',
      fieldset: 'appearance',
      options: {list: POKEMON_HABITATS},
    }),
    defineField({
      name: 'baseStats',
      title: 'Base stats',
      type: 'pokemonBaseStats',
      group: 'stats',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'abilities',
      title: 'Abilities',
      type: 'array',
      group: 'abilities',
      of: [defineArrayMember({type: 'pokemonAbilitySlot'})],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(3)
          .custom((slots: {ability?: {_ref?: string}; isHidden?: boolean}[] | undefined) => {
            if (!slots) return true
            if (slots.filter((slot) => slot.isHidden).length > 1) {
              return 'A Pokémon has at most one hidden ability'
            }
            const refs = slots.map((slot) => slot.ability?._ref).filter(Boolean)
            return new Set(refs).size === refs.length
              ? true
              : 'Each ability can only be listed once'
          }),
    }),
    defineField({
      name: 'evolvesFrom',
      title: 'Evolves from',
      type: 'reference',
      group: 'evolution',
      to: [{type: 'pokemon'}],
      validation: (rule) =>
        rule.custom((ref: {_ref?: string} | undefined, {document}) =>
          document && ref?._ref === getPublishedId(document._id)
            ? 'A Pokémon cannot evolve from itself'
            : true,
        ),
    }),
    defineField({
      name: 'evolutions',
      title: 'Evolves into',
      type: 'array',
      group: 'evolution',
      of: [defineArrayMember({type: 'pokemonEvolution'})],
    }),
    defineField({
      name: 'captureRate',
      title: 'Catch rate',
      description: 'From 0 to 255. Higher is easier to catch.',
      type: 'number',
      group: 'breeding',
      validation: (rule) => rule.integer().min(0).max(255),
    }),
    defineField({
      name: 'baseHappiness',
      title: 'Base friendship',
      type: 'number',
      group: 'breeding',
      validation: (rule) => rule.integer().min(0).max(255),
    }),
    defineField({
      name: 'growthRate',
      title: 'Growth rate',
      type: 'string',
      group: 'breeding',
      options: {list: GROWTH_RATES},
    }),
    defineField({
      name: 'eggGroups',
      title: 'Egg groups',
      type: 'array',
      group: 'breeding',
      of: [defineArrayMember({type: 'string'})],
      options: {list: EGG_GROUPS},
      validation: (rule) => rule.max(2).unique(),
    }),
    defineField({
      name: 'eggCycles',
      title: 'Egg cycles',
      type: 'number',
      group: 'breeding',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'genderless',
      title: 'Genderless',
      type: 'boolean',
      group: 'breeding',
      fieldset: 'gender',
      initialValue: false,
    }),
    defineField({
      name: 'femaleRatio',
      title: 'Female (%)',
      type: 'number',
      group: 'breeding',
      fieldset: 'gender',
      hidden: ({document}) => Boolean(document?.genderless),
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: 'artwork',
      title: 'Official artwork',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      description: 'A small sprite, cropped to the Pokémon so it reads well in lists.',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
    }),
    defineField({
      name: 'cry',
      title: 'Cry',
      description: 'Link to the sound the Pokémon makes in the latest games.',
      type: 'url',
      group: 'media',
    }),
  ],
  orderings: [
    {
      title: 'National Pokédex number',
      name: 'dexAsc',
      by: [{field: 'nationalDexNumber', direction: 'asc'}],
    },
    {
      title: 'National Pokédex number, descending',
      name: 'dexDesc',
      by: [{field: 'nationalDexNumber', direction: 'desc'}],
    },
    {title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
    {title: 'Fastest', name: 'speedDesc', by: [{field: 'baseStats.speed', direction: 'desc'}]},
    {title: 'Heaviest', name: 'weightDesc', by: [{field: 'weight', direction: 'desc'}]},
    {title: 'Tallest', name: 'heightDesc', by: [{field: 'height', direction: 'desc'}]},
  ],
  preview: {
    select: {
      name: 'name',
      number: 'nationalDexNumber',
      genus: 'genus',
      type0: 'types.0.name',
      type1: 'types.1.name',
      media: 'icon',
    },
    prepare: ({name, number, genus, type0, type1, media}) => ({
      title: name,
      subtitle: [formatDexNumber(number), [type0, type1].filter(Boolean).join(' / ')]
        .filter(Boolean)
        .join(' · '),
      description: genus,
      media,
    }),
  },
})
