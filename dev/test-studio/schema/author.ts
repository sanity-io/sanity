import {UserIcon as icon} from '@sanity/icons'
import {type PreviewConfig, type StringRule} from '@sanity/types'
import {defineField, defineType} from 'sanity'

const rulePreview: PreviewConfig = {
  select: {
    property: 'property',
    operator: 'operator',
    targetValue: 'targetValue',
    and: 'and',
  },
  prepare(context) {
    const property = context.property
    const operator = context.operator
    const targetValue = context.targetValue
    const and = context.and as Rule[]
    return {
      title: `${property} ${operator} ${targetValue} ${and ? `& ${and.map((a) => `${a.property} ${a.operator} ${a.targetValue}`).join(' & ')}` : ''}`,
    }
  },
}
const stringRule = defineField({
  name: 'stringRule',
  title: 'String Rule',
  type: 'object',
  fields: [
    defineField({
      name: 'property',
      title: 'Property',
      type: 'string',
      options: {
        // User configurable list
        list: ['audience', 'language'],
      },
    }),
    defineField({
      name: 'operator',
      title: 'Operator',
      type: 'string',
      options: {
        list: [
          {title: 'is equal to', value: 'equals'},
          {title: 'is not equal to', value: 'not-equals'},
          {title: 'contains', value: 'contains'},
          {title: 'does not contain', value: 'not-contains'},
          {title: 'is empty', value: 'is-empty'},
          {title: 'is not empty', value: 'is-not-empty'},
        ],
      },
    }),
    defineField({
      name: 'targetValue',
      title: 'Target Value',
      type: 'string',
      // components: {
      //   input: AudienceSelectInput,
      // },
    }),
  ],
  preview: rulePreview,
})
const numberRule = defineField({
  name: 'numberRule',
  title: 'Number Rule',
  type: 'object',
  preview: rulePreview,

  fields: [
    defineField({
      name: 'property',
      title: 'Property',
      type: 'string',
      options: {
        list: ['born', 'age'],
      },
    }),
    defineField({
      name: 'operator',
      title: 'Operator',
      type: 'string',
      options: {
        list: [
          {title: 'is equal to', value: 'equals'},
          {title: 'is not equal to', value: 'not-equals'},
          {title: 'is empty', value: 'is-empty'},
          {title: 'is not empty', value: 'is-not-empty'},
          {title: 'is greater than', value: '>'},
          {title: 'is less than', value: '<'},
          {title: 'is greater than or equal to', value: '>='},
          {title: 'is less than or equal to', value: '<='},
        ],
      },
    }),
    defineField({
      name: 'targetValue',
      title: 'Target Value',
      type: 'number',
    }),
  ],
})

interface Rule {
  property: string
  operator: string
  targetValue: string
  and?: Rule[]
}

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
            preview: {
              select: {
                rules: 'anyOf',
                value: 'value',
              },
              prepare(context) {
                const value = context.value
                const rules = context.rules as Rule[]

                return {
                  title: value,
                  subtitle: `${rules.map((rule) => `${rule.property} ${rule.operator} ${rule.targetValue} ${rule.and ? `& ${rule.and.map((and) => `${and.property} ${and.operator} ${and.targetValue}`).join(' & ')}` : ''}`).join(' | ')}`,
                }
              },
            },
            fields: [
              defineField({
                name: 'anyOf',
                title: 'Any of',
                description: 'If any of the rules are true, the condition is true',
                type: 'array',
                of: [
                  {
                    ...stringRule,
                    fields: [
                      ...stringRule.fields,
                      defineField({
                        name: 'and',
                        title: 'And',
                        type: 'array',
                        of: [stringRule, numberRule],
                      }),
                    ],
                  },
                  {
                    ...numberRule,
                    fields: [
                      ...numberRule.fields,
                      defineField({
                        name: 'and',
                        title: 'And',
                        type: 'array',
                        of: [stringRule, numberRule],
                      }),
                    ],
                  },
                ],
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

  initialValue: () => ({
    name: 'Foo',
    bestFriend: {_type: 'reference', _ref: 'foo-bar'},
    image: {
      _type: 'image',
      asset: {
        _ref: 'image-8dcc1391e06e4b4acbdc6bbf2e8c8588d537cbb8-4896x3264-jpg',
        _type: 'reference',
      },
    },
  }),
})
