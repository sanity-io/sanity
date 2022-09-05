import {ConfigContext, defineField, defineType} from 'sanity'
import {structureGroupOptions} from '../../../../structure/groupByOption'
import {randomKey} from '@sanity/block-tools'

export const validationTest = defineType({
  type: 'document',
  name: 'v3-validation',
  title: 'v3 validation',
  options: structureGroupOptions({
    structureGroup: 'v3',
  }),
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          // eslint-disable-next-line no-console
          console.log('Context in custom validation function', context)
          return `Always async error for projectId: ${context.projectId}`
        }),
      initialValue: async (params: undefined, context: ConfigContext) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            // eslint-disable-next-line no-console
            console.log('Context in delayed initial value function, string', context)
            resolve(context.projectId)
          }, 1000)
        })
      },
    }),
    {
      type: 'array',
      name: 'testArray',
      title: 'Test array',
      of: [
        {
          type: 'object',
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
          ],
          initialValue: async (params: undefined, context: ConfigContext) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                // eslint-disable-next-line no-console
                console.log('Context in delayed initial value function, array object', context)
                resolve({
                  title: context.projectId,
                })
              }, 1000)
            })
          },
        },
      ],
      initialValue: async (params: undefined, context: ConfigContext) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            // eslint-disable-next-line no-console
            console.log('Context in delayed initial value function, array', context)
            resolve([
              {
                _key: randomKey(12),
                title: context.projectId,
              },
            ])
          }, 1000)
        })
      },
    },
    {
      title: 'Block',
      name: 'blockText',
      type: 'array',
      of: [
        {type: 'block'},
        {
          type: 'object',
          name: 'testObject',
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
          ],
          initialValue: async (params: undefined, context: ConfigContext) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                // eslint-disable-next-line no-console
                console.log(
                  'Context in delayed initial value function, block array object',
                  context
                )
                resolve({
                  _type: 'testObject',
                  title: context.projectId,
                })
              }, 1000)
            })
          },
        },
      ],
      initialValue: async (params: undefined, context: ConfigContext) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            // eslint-disable-next-line no-console
            console.log('Context in delayed initial value function, block array', context)
            resolve([
              {
                style: 'normal',
                _type: 'block',
                markDefs: [],
                children: [
                  {
                    _type: 'span',
                    text: context.projectId,
                    marks: [],
                  },
                ],
              },
              {
                _type: 'testObject',
                title: context.projectId,
              },
            ])
          }, 1000)
        })
      },
    },
  ],
})
