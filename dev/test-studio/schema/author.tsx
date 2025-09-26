import {TrashIcon, UserIcon as icon} from '@sanity/icons'
import {type StringRule} from '@sanity/types'
import {type ArrayOfPrimitivesInputProps, defineField, defineType, getDraftId} from 'sanity'

import {AudienceSelectInput} from '../components/AudienceSelectInput'
import {IncomingReferencesInput} from '../components/incomingReferences/IncomingReferencesInput'

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
    }),
    defineField({
      hidden: true,
      name: 'incomingReferencesDesigner',
      title: 'Incoming references (author - designer)',
      type: 'array',
      components: {
        input: (props: ArrayOfPrimitivesInputProps) => (
          <IncomingReferencesInput
            {...props}
            onLinkDocument={(document, reference) => {
              return {
                ...document,
                bestFriend: reference,
              }
            }}
            actions={({linkedDocument, client}) => {
              if (linkedDocument._type === 'author') {
                return [
                  {
                    label: 'Unlink document',
                    icon: TrashIcon,
                    tone: 'critical',
                    onClick: async () => {
                      await client.createOrReplace({
                        ...linkedDocument,
                        _id: getDraftId(linkedDocument._id),
                        bestFriend: undefined,
                      })
                    },
                  },
                ]
              }
              return []
            }}
            filterQuery={`role == "designer"`}
            // creationAllowed={['author', 'author-developer']}
            // creationAllowed={false}
          />
        ),
      },
      of: [{type: 'author'}],
    }),
    defineField({
      name: 'booksCreated',
      title: 'Books created by this author',
      type: 'array',
      components: {
        input: (props: ArrayOfPrimitivesInputProps) => (
          <IncomingReferencesInput
            {...props}
            onLinkDocument={(document, reference) => {
              return {
                ...document,
                author: reference,
              }
            }}
            actions={({linkedDocument, client}) => {
              return [
                {
                  label: 'Unlink document',
                  icon: TrashIcon,
                  tone: 'critical',
                  onClick: async () => {
                    await client.createOrReplace({
                      ...linkedDocument,
                      _id: getDraftId(linkedDocument._id),
                      author: undefined,
                    })
                  },
                },
              ]
            }}
          />
        ),
      },
      of: [{type: 'book'}],
    }),
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
    return {
      name: 'Foo',
      bestFriend: params?.reference || {_type: 'reference', _ref: 'foo-bar'},
      image: {
        _type: 'image',
        asset: {
          _ref: 'image-8dcc1391e06e4b4acbdc6bbf2e8c8588d537cbb8-4896x3264-jpg',
          _type: 'reference',
        },
      },
      role: params?.from?.fieldName === 'incomingReferencesDesigner' ? 'designer' : undefined,
    }
  },
})
