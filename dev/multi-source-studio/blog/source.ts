import {SanitySourceConfig} from '@sanity/base'
import {schemaTypes} from './schema'

export const blogSource: SanitySourceConfig = {
  name: 'blog',
  title: 'Blog',
  projectId: 'ppsg7ml5',
  dataset: 'test-multi-schema',
  schemaTypes,

  // assetsSources: []

  // initialValueTemplates: (T, {schema}) => [
  //   ...T.defaults(schema),

  //   {
  //     schemaType: 'post',
  //     id: 'test',
  //     title: 'Test',
  //     value: {_type: 'post'},
  //   },
  // ],

  // @todo - Should we support `plugins` for a source?
  // plugins: []
}
