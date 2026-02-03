import {defineType} from '@sanity/types'

import {FormInputExample} from '../../../../components/formBuilder/FormInputExample'
import {structureGroupOptions} from '../../../../structure/groupByOption'

export const formInputTest = defineType({
  name: 'formInputTest',
  title: 'FormInput Test',
  type: 'document',
  options: structureGroupOptions({
    structureGroup: 'v3',
  }),
  components: {
    input: FormInputExample,
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'array',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'title', type: 'string'},
            {name: 'text', type: 'string'},
          ],
        },
      ],
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'nested',
      type: 'object',
      fields: [{name: 'nested', type: 'string'}],
    },
  ],
})
