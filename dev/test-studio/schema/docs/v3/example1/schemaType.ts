import {structureGroupOptions} from '../../../../structure/groupByOption'
import {CodeInput} from './CodeInput'

export const example1SchemaType = {
  type: 'document',
  name: 'v3-example1',
  title: 'v3 example #1',
  options: structureGroupOptions({
    structureGroup: 'v3',
  }),
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },

    {
      type: 'object',
      name: 'code',
      title: 'Code',

      components: {
        input: CodeInput,
      },

      fields: [
        {
          type: 'text',
          name: 'code',
          title: 'Code',
        },
      ],
    },
  ],
}
