import {defineArrayMember, defineField, defineType} from 'sanity'
import {getPublishedId} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {
  EGG_GROUPS,
  EVOLUTION_TRIGGERS,
  GROWTH_RATES,
  POKEMON_COLORS,
  POKEMON_HABITATS,
  POKEMON_ROLES,
  POKEMON_SHAPES,
  STAT_NAMES,
  VARIETY_KINDS,
} from '../constants'
import {PokeballIcon} from '../PokeballIcon'
import {countField, summaryField} from './shared'

const MULTIPLIERS = [
  {title: '4×', value: 4},
  {title: '2×', value: 2},
  {title: '½×', value: 0.5},
  {title: '¼×', value: 0.25},
]

export function formatDexNumber(number: number | undefined): string {
  return typeof number === 'number' ? `#${String(number).padStart(4, '0')}` : '#????'
}

function optionTitle(options: {title: string; value: string | number}[], value: unknown) {
  return options.find((option) => option.value === value)?.title
}

export const pokemonBaseStats = defineType({
  name: 'pokemonBaseStats',
  title: 'Base stats',
  type: 'object',
  options: {columns: 3},
  fields: [
    ...STAT_NAMES.map((stat) =>
      defineField({
        name: stat.name,
        title: stat.title,
        type: 'number',
        validation: (rule) => rule.required().integer().min(1).max(255),
      }),
    ),
    defineField({
      name: 'total',
      title: 'Total',
      type: 'number',
      validation: (rule) =>
        rule
          .integer()
          .custom((total, {parent}) =>
            total === undefined ||
            total ===
              STAT_NAMES.reduce(
                (sum, stat) => sum + ((parent as Record<string, number>)?.[stat.name] ?? 0),
                0,
              )
              ? true
              : 'The total must be the sum of the six base stats',
          ),
    }),
  ],
  preview: {
    select: Object.fromEntries(STAT_NAMES.map((stat) => [stat.name, stat.name])),
    prepare: (stats: Record<string, number | undefined>) => ({
      title: `Total ${STAT_NAMES.reduce((total, stat) => total + (stats[stat.name] ?? 0), 0)}`,
      subtitle: STAT_NAMES.map((stat) => `${stat.title} ${stats[stat.name] ?? '–'}`).join(' · '),
    }),
  },
})

export const pokemonEvYields = defineType({
  name: 'pokemonEvYields',
  title: 'EV yield',
  description: 'The effort values a Pokémon gains for defeating this one.',
  type: 'object',
  options: {columns: 3},
  fields: STAT_NAMES.map((stat) =>
    defineField({
      name: stat.name,
      title: stat.title,
      type: 'number',
      validation: (rule) => rule.integer().min(0).max(3),
    }),
  ),
})

export const pokemonTypeMatchup = defineType({
  name: 'pokemonTypeMatchup',
  title: 'Type matchup',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Attacking type',
      type: 'reference',
      to: [{type: 'pokemonType'}],
      options: {disableNew: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'multiplier',
      title: 'Damage taken',
      type: 'number',
      options: {list: MULTIPLIERS},
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {type: 'type.name', multiplier: 'multiplier', media: 'type.icon'},
    prepare: ({type, multiplier, media}) => ({
      title: type,
      subtitle: optionTitle(MULTIPLIERS, multiplier),
      media,
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

export const pokemonLearnedMove = defineType({
  name: 'pokemonLearnedMove',
  title: 'Learned move',
  type: 'object',
  fields: [
    defineField({
      name: 'move',
      title: 'Move',
      type: 'reference',
      to: [{type: 'pokemonMove'}],
      options: {disableNew: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'Level',
      description: '0 means the move is learned when the Pokémon evolves.',
      type: 'number',
      validation: (rule) => rule.integer().min(0).max(100),
    }),
  ],
  preview: {
    select: {title: 'move.name', level: 'level', type: 'move.type.name'},
    prepare: ({title, level, type}) => ({
      title,
      subtitle: [level === 0 ? 'On evolution' : `Level ${level}`, type].join(' · '),
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
      title: 'Trigger',
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
      hidden: ({parent}) =>
        !parent?.item && parent?.trigger !== 'use-item' && parent?.trigger !== 'trade',
    }),
    defineField({
      name: 'condition',
      title: 'Condition',
      description: 'Any further requirement, for example “with high friendship” or “at night”.',
      type: 'string',
    }),
    defineField({
      name: 'method',
      title: 'Method',
      description: 'Everything above in one phrase, for example “using a Moon Stone”.',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      name: 'pokemon.name',
      media: 'pokemon.icon',
      trigger: 'trigger',
      method: 'method',
    },
    prepare: ({name, media, trigger, method}) => ({
      title: name ? `→ ${name}` : 'Missing Pokémon',
      subtitle: method || optionTitle(EVOLUTION_TRIGGERS, trigger),
      media,
    }),
  },
})

export const pokemonVariety = defineType({
  name: 'pokemonVariety',
  title: 'Form',
  type: 'object',
  fieldsets: [{name: 'physical', title: 'Physical', options: {columns: 3}}],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'PokéAPI name',
      type: 'string',
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {list: VARIETY_KINDS},
    }),
    defineField({
      name: 'types',
      title: 'Types',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'pokemonType'}],
          options: {disableNew: true},
        }),
      ],
      validation: (rule) => rule.min(1).max(2).unique(),
    }),
    defineField({
      name: 'abilities',
      title: 'Abilities',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'pokemonAbility'}],
          options: {disableNew: true},
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'baseStatTotal',
      title: 'Base stat total',
      type: 'number',
      fieldset: 'physical',
    }),
    defineField({name: 'height', title: 'Height (m)', type: 'number', fieldset: 'physical'}),
    defineField({name: 'weight', title: 'Weight (kg)', type: 'number', fieldset: 'physical'}),
  ],
  preview: {
    select: {
      title: 'name',
      kind: 'kind',
      type0: 'types.0.name',
      type1: 'types.1.name',
      total: 'baseStatTotal',
    },
    prepare: ({title, kind, type0, type1, total}) => ({
      title,
      subtitle: [
        optionTitle(VARIETY_KINDS, kind),
        [type0, type1].filter(Boolean).join(' / '),
        total && `BST ${total}`,
      ]
        .filter(Boolean)
        .join(' · '),
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
    {name: 'pokedex', title: 'Pokédex'},
    {name: 'battle', title: 'Battle'},
    {name: 'abilities', title: 'Abilities'},
    {name: 'moves', title: 'Moves'},
    {name: 'evolution', title: 'Evolution'},
    {name: 'forms', title: 'Forms'},
    {name: 'breeding', title: 'Training & breeding'},
    {name: 'media', title: 'Media'},
  ],
  fieldsets: [
    {name: 'status', title: 'Status', options: {columns: 3}},
    {name: 'physical', title: 'Physical', options: {columns: 2}},
    {name: 'appearance', title: 'Appearance', options: {columns: 3}},
    {name: 'pokedexEntry', title: 'Latest Pokédex entry'},
    {name: 'matchups', title: 'Type matchups', description: 'Damage taken from attacking types.'},
    {name: 'gender', title: 'Gender', options: {columns: 2}},
    {name: 'cries', title: 'Cries', options: {columns: 2}},
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
    summaryField('overview'),
    defineField({
      name: 'flavorText',
      title: 'Description',
      type: 'text',
      rows: 3,
      group: ['overview', 'pokedex'],
      fieldset: 'pokedexEntry',
    }),
    defineField({
      name: 'flavorTextGame',
      title: 'From',
      description: 'The game the description is taken from.',
      type: 'string',
      group: ['overview', 'pokedex'],
      fieldset: 'pokedexEntry',
    }),
    defineField({
      name: 'description',
      title: 'All Pokédex entries',
      description: 'Every unique entry below, oldest game first, as one text.',
      type: 'text',
      rows: 6,
      group: 'pokedex',
    }),
    defineField({
      name: 'pokedexEntries',
      title: 'Pokédex entries',
      description: 'Each unique English entry, with every game that uses it.',
      type: 'array',
      group: 'pokedex',
      of: [defineArrayMember({type: 'pokemonFlavorTextEntry'})],
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
      group: 'pokedex',
      fieldset: 'appearance',
      options: {list: POKEMON_COLORS},
    }),
    defineField({
      name: 'shape',
      title: 'Shape',
      type: 'string',
      group: 'pokedex',
      fieldset: 'appearance',
      options: {list: POKEMON_SHAPES},
    }),
    defineField({
      name: 'habitat',
      title: 'Habitat',
      type: 'string',
      group: 'pokedex',
      fieldset: 'appearance',
      options: {list: POKEMON_HABITATS},
    }),
    defineField({
      name: 'baseStats',
      title: 'Base stats',
      type: 'pokemonBaseStats',
      group: 'battle',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'roles',
      title: 'Battle roles',
      description: 'Derived from the base stats and the moves it learns.',
      type: 'array',
      group: 'battle',
      of: [defineArrayMember({type: 'string'})],
      options: {list: POKEMON_ROLES, layout: 'grid'},
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'typeEffectiveness',
      title: 'Type effectiveness',
      description: 'The matchups below, as a sentence.',
      type: 'text',
      rows: 2,
      group: 'battle',
      fieldset: 'matchups',
    }),
    defineField({
      name: 'weaknesses',
      title: 'Weak to',
      type: 'array',
      group: 'battle',
      fieldset: 'matchups',
      of: [defineArrayMember({type: 'pokemonTypeMatchup'})],
    }),
    defineField({
      name: 'resistances',
      title: 'Resistant to',
      type: 'array',
      group: 'battle',
      fieldset: 'matchups',
      of: [defineArrayMember({type: 'pokemonTypeMatchup'})],
    }),
    defineField({
      name: 'immunities',
      title: 'Immune to',
      type: 'array',
      group: 'battle',
      fieldset: 'matchups',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'pokemonType'}],
          options: {disableNew: true},
        }),
      ],
      validation: (rule) => rule.unique(),
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
      name: 'signatureMoves',
      title: 'Signature moves',
      description: 'Moves no other Pokémon can learn.',
      type: 'array',
      group: 'moves',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'pokemonMove'}],
          options: {disableNew: true},
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'levelUpMovesGame',
      title: 'Level-up moves from',
      description: 'The most recent game the level-up moves are taken from.',
      type: 'string',
      group: 'moves',
    }),
    defineField({
      name: 'levelUpMoves',
      title: 'Level-up moves',
      type: 'array',
      group: 'moves',
      of: [defineArrayMember({type: 'pokemonLearnedMove'})],
    }),
    {
      ...countField(
        'moveCount',
        'Learnable moves',
        'How many different moves it can learn across all games, by any method.',
      ),
      group: 'moves',
    },
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
      name: 'evolutionMethod',
      title: 'Evolves from it',
      description: 'How the previous stage evolves into this Pokémon.',
      type: 'string',
      group: 'evolution',
      hidden: ({document}) => !document?.evolvesFrom,
    }),
    defineField({
      name: 'evolutions',
      title: 'Evolves into',
      type: 'array',
      group: 'evolution',
      of: [defineArrayMember({type: 'pokemonEvolution'})],
    }),
    defineField({
      name: 'evolutionStage',
      title: 'Stage',
      description: '1 for the first Pokémon of its evolution line.',
      type: 'number',
      group: 'evolution',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'evolutionChain',
      title: 'Evolution line',
      description: 'The whole evolution line, one sentence per evolution.',
      type: 'text',
      rows: 3,
      group: 'evolution',
    }),
    defineField({
      name: 'varieties',
      title: 'Other forms',
      description: 'Mega Evolutions, Gigantamax and regional forms, and other alternate forms.',
      type: 'array',
      group: 'forms',
      of: [defineArrayMember({type: 'pokemonVariety'})],
    }),
    defineField({
      name: 'formsSwitchable',
      title: 'Can switch forms',
      description: 'Whether it can change between its forms after it is caught.',
      type: 'boolean',
      group: 'forms',
    }),
    defineField({
      name: 'evYields',
      title: 'EV yield',
      type: 'pokemonEvYields',
      group: 'breeding',
    }),
    defineField({
      name: 'baseExperience',
      title: 'Base experience',
      type: 'number',
      group: 'breeding',
      validation: (rule) => rule.integer().min(0),
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
      name: 'hatchCounter',
      title: 'Egg cycles',
      description: 'How long its egg takes to hatch. Each cycle is about 255 steps.',
      type: 'number',
      group: 'breeding',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'heldItems',
      title: 'Wild held items',
      description: 'Items it may be holding when found in the wild.',
      type: 'array',
      group: 'breeding',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
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
      name: 'genderRate',
      title: 'Gender rate',
      description: 'The chance of being female in eighths, or -1 for genderless.',
      type: 'number',
      group: 'breeding',
      fieldset: 'gender',
      validation: (rule) => rule.integer().min(-1).max(8),
    }),
    defineField({
      name: 'hasGenderDifferences',
      title: 'Looks different by gender',
      type: 'boolean',
      group: 'breeding',
      fieldset: 'gender',
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
      description: 'The sound it makes in the latest games.',
      type: 'url',
      group: 'media',
      fieldset: 'cries',
    }),
    defineField({
      name: 'cryLegacy',
      title: 'Legacy cry',
      description: 'The sound it made in the older games.',
      type: 'url',
      group: 'media',
      fieldset: 'cries',
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
    {
      title: 'Strongest',
      name: 'totalDesc',
      by: [{field: 'baseStats.total', direction: 'desc'}],
    },
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
