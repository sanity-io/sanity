import assert from 'assert'
import {matchWorkspace} from '../matchWorkspace'

describe('matchWorkspace', () => {
  it('returns a match if the incoming `pathname` matches a workspace `basePath`', () => {
    const foo = {name: 'foo', basePath: '/common/foo'}
    const bar = {name: 'bar', basePath: '/common/bar'}
    const baz = {name: 'baz', basePath: '/common/baz'}

    const result = matchWorkspace({
      workspaces: [foo, bar, baz],
      pathname: '/common/bar',
    })

    assert(result.type === 'match')
    expect(result.workspace).toBe(bar)
  })

  it('results in a redirect to the first workspace if the incoming pathname is exactly `/`', () => {
    const commonBasePath = `/x/common`
    const foo = {name: 'foo', basePath: `${commonBasePath}/foo`}
    const bar = {name: 'bar', basePath: `${commonBasePath}/bar`}

    const resultOne = matchWorkspace({
      workspaces: [foo, bar],
      pathname: '/',
    })

    assert(resultOne.type === 'redirect')
    expect(resultOne.pathname).toBe(foo.basePath) // the first workspace in the array
  })

  it('results in a redirect to the first workspace if the incoming `pathname` partially matches the common base path', () => {
    const commonBasePath = `/x/common`
    const foo = {name: 'foo', basePath: `${commonBasePath}/foo`}
    const bar = {name: 'bar', basePath: `${commonBasePath}/bar`}
    const baz = {name: 'baz', basePath: `${commonBasePath}/baz`}

    const resultOne = matchWorkspace({
      workspaces: [foo, bar, baz],
      // this partially matches the common base path so it'll result in a redirect
      pathname: '/x',
    })

    assert(resultOne.type === 'redirect')
    expect(resultOne.pathname).toBe(foo.basePath) // the first workspace in the array

    // try it again but with more of the common base path
    const resultTwo = matchWorkspace({
      workspaces: [foo, bar, baz],
      pathname: '/x/common',
    })

    assert(resultTwo.type === 'redirect')
    expect(resultTwo.pathname).toBe(foo.basePath)
  })

  it('results in not-found match if the incoming `pathname` is only a substring of the workspace (edge case)', () => {
    const foo = {name: 'foo', basePath: '/common/foo'}
    const bar = {name: 'bar', basePath: '/common/bar'}
    const baz = {name: 'baz', basePath: '/common/baz'}

    const result = matchWorkspace({
      workspaces: [foo, bar, baz],
      // this should not match anything
      pathname: '/common/ba',
    })

    expect(result.type).toBe('not-found')
  })
})
