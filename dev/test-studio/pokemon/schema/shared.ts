import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * The seed script writes one plain-language paragraph per document that restates its structured
 * fields ("Weak to Rock (4×)…", "Evolves into Clefable using a Moon Stone"), so semantic search
 * matches natural-language queries against facts that otherwise only live in references.
 */
export function summaryField(group?: string) {
  return defineField({
    name: 'summary',
    title: 'Summary',
    description:
      'A plain-language overview of the fields of this document, written by the seed script for semantic search.',
    type: 'text',
    rows: 8,
    ...(group && {group}),
  })
}

export const pokemonFlavorTextEntry = defineType({
  name: 'pokemonFlavorTextEntry',
  title: 'Flavor text',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'games',
      title: 'Games',
      description: 'Every game that uses this text.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
  ],
  preview: {
    select: {title: 'text', games: 'games'},
    prepare: ({title, games}: {title?: string; games?: string[]}) => ({
      title,
      subtitle: games?.join(', '),
    }),
  },
})

export function flavorTextEntriesField(description: string) {
  return defineField({
    name: 'flavorTextEntries',
    title: 'All flavor texts',
    description,
    type: 'array',
    of: [defineArrayMember({type: 'pokemonFlavorTextEntry'})],
  })
}

export function countField(name: string, title: string, description: string) {
  return defineField({
    name,
    title,
    description,
    type: 'number',
    readOnly: true,
    validation: (rule) => rule.integer().min(0),
  })
}
