import {SanitySourceConfig} from '@sanity/base'
import {schemaTypes} from './schema'

export const docsSource: SanitySourceConfig = {
  name: 'docs',
  title: 'Docs',
  projectId: 'ppsg7ml5',
  dataset: 'test-multi-schema',
  schemaTypes,

  // initialValueTemplates: (T, options) => [
  //   ...T.defaults(options.schema),
  //   T.template().schemaType('article').id('test').title('Test').value({_type: 'article'}),
  // ],

  // structureDocumentNode: (S, options) => {
  //   if (options.schemaType === 'article') {
  //     // return S.document()
  //   }

  //   return null
  // },
}
