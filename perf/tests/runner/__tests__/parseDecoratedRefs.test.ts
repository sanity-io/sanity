import {parseDecoratedRefs} from '../utils/gitUtils'

test('parseDecoratedRefs', () => {
  expect(parseDecoratedRefs('')).toEqual({branches: [], tags: []})
  expect(parseDecoratedRefs('HEAD -> ')).toEqual({branches: [], tags: []})
  expect(parseDecoratedRefs('HEAD, origin/perf-testing')).toEqual({
    branches: ['perf-testing'],
    tags: [],
  })
  expect(parseDecoratedRefs('HEAD -> perf-testing, origin/perf-testing')).toEqual({
    branches: ['perf-testing'],
    tags: [],
  })
  expect(parseDecoratedRefs('HEAD -> test, tag: v3.0.0, v3-current')).toEqual({
    branches: ['test', 'v3-current'],
    tags: ['v3.0.0'],
  })
})
