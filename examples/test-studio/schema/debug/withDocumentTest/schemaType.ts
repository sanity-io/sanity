import {WithDocumentTestInput} from './components/withDocumentTestInput'

export const withDocumentTestSchemaType = {
  type: 'document',
  name: 'withDocumentTest',
  title: 'Test `withDocument`',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {
      type: 'string',
      name: 'withDocumentTest',
      title: 'WithDocumentTest',
      inputComponent: WithDocumentTestInput,
    },
  ],
}
