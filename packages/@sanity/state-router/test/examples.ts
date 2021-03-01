import route from '../src/route'

/* eslint-disable quote-props */

export const router = route('/:dataset', [
  route('/settings/:setting'),
  route('/tools/:tool', (params: any): any => {
    if (params.tool === 'desk') {
      return [route.scope('desk', '/collections/:collection')]
    }
    if (params.tool === 'another-tool') {
      return [route.scope('another-tool', '/omg/:nope')]
    }
    return null
  }),
])

export const examples: Array<[string, {}]> = [
  ['/some-dataset', {dataset: 'some-dataset'}],
  ['/some-dataset/tools/desk', {dataset: 'some-dataset', tool: 'desk'}],
  [
    '/some-dataset/settings/desk',
    {
      dataset: 'some-dataset',
      setting: 'desk',
    },
  ],
  [
    '/some-dataset/tools/desk',
    {
      dataset: 'some-dataset',
      tool: 'desk',
    },
  ],
  [
    '/some-dataset/tools/desk/collections/articles',
    {
      dataset: 'some-dataset',
      tool: 'desk',
      desk: {
        collection: 'articles',
      },
    },
  ],
  [
    '/some-dataset/tools/another-tool/omg/foo',
    {
      dataset: 'some-dataset',
      tool: 'another-tool',
      'another-tool': {
        nope: 'foo',
      },
    },
  ],
  [
    '/some-dataset/tools/another-tool/omg/foo',
    {
      dataset: 'some-dataset',
      tool: 'another-tool',
      'another-tool': {
        nope: 'foo',
      },
    },
  ],
]
