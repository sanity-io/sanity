/* eslint-disable quote-props */

import {route} from '../route'

export const router = route.create('/:dataset', [
  route.create('/settings/:setting'),
  route.create('/tools/:tool', (params: any): any => {
    if (params.tool === 'structure') {
      return [route.scope('structure', '/collections/:collection')]
    }
    if (params.tool === 'another-tool') {
      return [route.scope('another-tool', '/omg/:nope')]
    }
    return null
  }),
])

export const examples: Array<[string, Record<string, string | Record<string, string>>]> = [
  ['/some-dataset', {dataset: 'some-dataset'}],
  ['/some-dataset/tools/structure', {dataset: 'some-dataset', tool: 'structure'}],
  [
    '/some-dataset/settings/structure',
    {
      dataset: 'some-dataset',
      setting: 'structure',
    },
  ],
  [
    '/some-dataset/tools/structure',
    {
      dataset: 'some-dataset',
      tool: 'structure',
    },
  ],
  [
    '/some-dataset/tools/structure/collections/articles',
    {
      dataset: 'some-dataset',
      tool: 'structure',
      structure: {
        collection: 'articles',
      },
    },
  ],
  [
    '/some-dataset/tools/another-tool/omg/foo',
    {
      'dataset': 'some-dataset',
      'tool': 'another-tool',
      'another-tool': {
        nope: 'foo',
      },
    },
  ],
  [
    '/some-dataset/tools/another-tool/omg/foo',
    {
      'dataset': 'some-dataset',
      'tool': 'another-tool',
      'another-tool': {
        nope: 'foo',
      },
    },
  ],
]
