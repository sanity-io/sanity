import {defineField, defineType} from 'sanity'

export const validationTest = defineType({
  type: 'document',
  name: 'v3-validation',
  title: 'v3 validation',

  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          return true
        }),
      initialValue: async (params: any, context: any) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(context?.client.config().dataset)
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
          initialValue: async () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                return resolve({
                  title: `${Math.random()}`,
                })
              }, 1000)
            })
          },
        },
      ],
    },
  ],
})
