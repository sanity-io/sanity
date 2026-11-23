import {BoltIcon} from '@sanity/icons/Bolt'
import {defineArrayMember, defineField, defineType} from 'sanity'

function typeReferences(field: {
  name: string
  title: string
  description: string
  fieldset: 'attacking' | 'defending'
}) {
  return defineField({
    ...field,
    type: 'array',
    of: [defineArrayMember({type: 'reference', to: [{type: 'pokemonType'}]})],
    validation: (rule) => rule.unique(),
  })
}

export const pokemonType = defineType({
  name: 'pokemonType',
  title: 'Type',
  type: 'document',
  icon: BoltIcon,
  fieldsets: [
    {
      name: 'attacking',
      title: 'When attacking',
      description: 'How effective moves of this type are against Pokémon of other types.',
    },
    {
      name: 'defending',
      title: 'When defending',
      description: 'How effective moves of other types are against Pokémon of this type.',
    },
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
      name: 'color',
      title: 'Color',
      description: 'Hex color used for this type across the games, for example #EE8130.',
      type: 'string',
      validation: (rule) => rule.required().regex(/^#[0-9a-f]{6}$/i, {name: 'hex color'}),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      validation: (rule) => rule.required(),
    }),
    typeReferences({
      name: 'strongAgainst',
      title: 'Super effective against',
      description: 'Deals 2× damage.',
      fieldset: 'attacking',
    }),
    typeReferences({
      name: 'notVeryEffectiveAgainst',
      title: 'Not very effective against',
      description: 'Deals ½× damage.',
      fieldset: 'attacking',
    }),
    typeReferences({
      name: 'noEffectAgainst',
      title: 'No effect against',
      description: 'Deals no damage.',
      fieldset: 'attacking',
    }),
    typeReferences({
      name: 'weakTo',
      title: 'Weak to',
      description: 'Takes 2× damage.',
      fieldset: 'defending',
    }),
    typeReferences({
      name: 'resistantTo',
      title: 'Resistant to',
      description: 'Takes ½× damage.',
      fieldset: 'defending',
    }),
    typeReferences({
      name: 'immuneTo',
      title: 'Immune to',
      description: 'Takes no damage.',
      fieldset: 'defending',
    }),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {
      title: 'name',
      media: 'icon',
      strong0: 'strongAgainst.0.name',
      strong1: 'strongAgainst.1.name',
      strong2: 'strongAgainst.2.name',
      strong3: 'strongAgainst.3.name',
      strong4: 'strongAgainst.4.name',
    },
    prepare({title, media, strong0, strong1, strong2, strong3, strong4}) {
      const names = [strong0, strong1, strong2, strong3, strong4].filter(Boolean)
      return {
        title,
        media,
        subtitle: names.length > 0 ? `Super effective against ${names.join(', ')}` : undefined,
      }
    },
  },
})
