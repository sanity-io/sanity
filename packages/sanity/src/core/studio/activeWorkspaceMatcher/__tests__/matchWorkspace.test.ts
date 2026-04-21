// oxlint-disable no-explicit-any
import assert from 'node:assert'

import {describe, expect, it} from 'vitest'

import {type WorkspaceLike} from '../../workspaces'
import {createCommonBasePathRegex} from '../createCommonBasePathRegex'
import {matchWorkspace as actualMatchWorkspace} from '../matchWorkspace'
import {normalizedWorkspaces} from '../useNormalizedWorkspaces'

describe('matchWorkspace', () => {
  const matchWorkspace = ({
    pathname,
    workspaces,
  }: {
    pathname: string
    workspaces: WorkspaceLike[]
  }) => {
    const normalized = normalizedWorkspaces(workspaces as any)
    const basePathRegex = createCommonBasePathRegex(normalized)
    return actualMatchWorkspace({basePathRegex, pathname, workspaces: normalized})
  }
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

  it('redirects to the first visible workspace when static hidden workspaces are pre-filtered', () => {
    const editor = {name: 'editor', basePath: '/common/editor'}

    // Simulate pre-filtering: admin workspace has hidden: true and was removed before matching
    const result = matchWorkspace({
      workspaces: [editor],
      pathname: '/',
    })

    assert(result.type === 'redirect')
    expect(result.pathname).toBe(editor.basePath)
  })

  it('returns not-found when navigating to a path that was filtered out due to hidden', () => {
    const editor = {name: 'editor', basePath: '/common/editor'}

    // Simulate pre-filtering: admin workspace at /common/admin removed, user navigates to its path
    const result = matchWorkspace({
      workspaces: [editor],
      pathname: '/common/admin',
    })

    expect(result.type).toBe('not-found')
  })

  it('matches the correct workspace when hidden workspaces are removed from the list', () => {
    const editor = {name: 'editor', basePath: '/common/editor'}
    const viewer = {name: 'viewer', basePath: '/common/viewer'}

    // Simulate admin being hidden - only editor and viewer remain
    const result = matchWorkspace({
      workspaces: [editor, viewer],
      pathname: '/common/viewer',
    })

    assert(result.type === 'match')
    expect(result.workspace).toBe(viewer)
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
