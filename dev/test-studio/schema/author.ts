import {UserIcon as icon} from '@sanity/icons'
import {type StringRule} from '@sanity/types'
import {defineDecoration, defineField, defineType, isIncomingReferenceCreation} from 'sanity'

import {AudienceSelectInput} from '../components/AudienceSelectInput'
import {RemoveReferenceAction} from '../components/IncomingReferencesActions'

// Generic decide field implementation that works for all types
const defineLocalDecideField = (config: any) => {
  const {name, title, description, type, ...otherConfig} = config

  const valueFieldConfig = {
    type,
    // ...(to && {to}),
    // ...(validation && {validation}),
    // ...(description && {description}),
    // ...(readOnly && {readOnly}),
    // ...(hidden && {hidden}),
    ...otherConfig,
  }

  return defineField({
    name,
    title,
    description,
    type: 'object',
    fields: [
      defineField({
        name: 'default',
        title: 'Default Value',
        ...valueFieldConfig,
      }),
      defineField({
        name: 'conditions',
        title: 'Conditions',
        type: 'array',
        of: [
          defineField({
            type: 'object',
            name: 'condition',
            title: 'Condition',
            fields: [
              defineField({
                name: 'audience',
                title: 'Audience Equality',
                validation: (Rule) => Rule.required(),
                type: 'string',
                components: {
                  input: AudienceSelectInput,
                },
              }),
              defineField({
                name: 'value',
                title: 'Value',
                ...valueFieldConfig,
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

const AUTHOR_ROLES = [
  {value: 'developer', title: 'Developer'},
  {value: 'designer', title: 'Designer'},
  {value: 'ops', title: 'Operations'},
]

export default defineType({
  name: 'author',
  type: 'document',
  title: 'Author',
  icon,
  description: 'This represents an author',
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      role: 'role',
      relatedAuthors: 'relatedAuthors',
      lastUpdated: '_updatedAt',
      media: 'image',
    },
    prepare({title, media, awards, role: roleName}: any) {
      const role = roleName ? AUTHOR_ROLES.find((option) => option.value === roleName) : undefined
      const awardsText = Array.isArray(awards) && awards.filter(Boolean).join(', ')

      return {
        title: typeof title === 'string' ? title : undefined,
        media: media as any,
        subtitle: [role?.title, awardsText].filter(Boolean).join(' · '),
      }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      options: {
        search: {weight: 100},
      },
      validation: (rule: StringRule) => rule.required(),
    }),
    defineDecoration({
      type: 'incomingReferences',
      name: 'incomingReferencesDesigner',
      title: 'Incoming references with the same role',
      options: {
        onLinkDocument: (document, reference) => {
          return {
            ...document,
            bestFriend: reference,
          }
        },
        filter: (context) => {
          return {
            filter: `role == $role`,
            filterParams: {role: (context.document.role as string) || ''},
          }
        },
        actions: [RemoveReferenceAction],
        types: [{type: 'author'}],
      },
    }),
    defineDecoration({
      type: 'incomingReferences',
      name: 'booksCreated',
      title: 'Books created by this author',
      options: {
        onLinkDocument: (document, reference) => {
          return {
            ...document,
            author: reference,
          }
        },
        actions: [RemoveReferenceAction],
        types: [
          {type: 'book'},
          {
            type: 'book',
            dataset: 'test-us',
            title: 'Book in test-us dataset',
            studioUrl: ({id, type}) => {
              return type ? `/us/intent/edit/id=${id};type=${type}` : null
            },
            preview: {
              select: {title: 'title', media: 'coverImage', subtitle: 'publicationYear'},
            },
          },
        ],
      },
    }),
    {
      name: 'bestFriend',
      title: 'Best friend',
      type: 'reference',
      to: [{type: 'author'}],
    },
    defineLocalDecideField(
      defineField({
        name: 'decideName',
        title: '[Decide] Name',
        type: 'string',
        options: {
          search: {weight: 100},
        },
        validation: (rule: StringRule) => rule.required(),
      }),
    ),
    defineLocalDecideField({
      name: 'decideBestFriend',
      title: '[Decide] Best Friend',
      type: 'reference',
      to: [{type: 'author'}],
    }),
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: AUTHOR_ROLES,
      },
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'awards',
      title: 'Awards',
      type: 'array',
      of: [
        {
          type: 'string',
        },
      ],
    },
    {
      name: 'favoriteBooks',
      title: 'Favorite books',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'book'},
        },
      ],
    },
    {
      name: 'minimalBlock',
      title: 'Reset all options',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
    },
    // {
    //   name: 'specie',
    //   title: 'Specie',
    //   description: 'There are a lot of species. Use this to test reference search performence',
    //   type: 'reference',
    //   to: {type: 'species'},
    // },
    {
      name: 'locked',
      title: 'Locked',
      description: 'Used for testing the "locked" permissions pattern',
      type: 'boolean',
    },
  ],

  initialValue: (params) => {
    if (isIncomingReferenceCreation(params)) {
      return {
        name: 'Foo',
        bestFriend: params.reference,
        image: {
          _type: 'image',
          asset: {
            _ref: 'image-8dcc1391e06e4b4acbdc6bbf2e8c8588d537cbb8-4896x3264-jpg',
            _type: 'reference',
          },
        },
        role: params.from.fieldName === 'incomingReferencesDesigner' ? 'designer' : undefined,
      }
    }

    return {
      name: 'Foo',
      bestFriend: {_type: 'reference', _ref: 'foo-bar'},
      image: {
        _type: 'image',
        asset: {
          _ref: 'image-8dcc1391e06e4b4acbdc6bbf2e8c8588d537cbb8-4896x3264-jpg',
          _type: 'reference',
        },
      },
    }
  },
})
