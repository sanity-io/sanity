import {WithParentTestInput} from './WithParentTestInput'

export const withParentTestSchemaType = {
  type: 'document',
  name: 'withParentTest',
  title: 'Test `withParent`',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {
      type: 'string',
      name: 'withParentTest',
      title: 'WithParentTest',
      inputComponent: WithParentTestInput,
    },
    {
      type: 'object',
      name: 'object',
      title: 'WithParentOnObjectTest',
      fields: [
        {type: 'string', name: 'title', title: 'Title'},
        {
          type: 'string',
          name: 'withParentTest',
          title: 'WithParentTest',
          inputComponent: WithParentTestInput,
        },
      ],
    },
  ],
}
