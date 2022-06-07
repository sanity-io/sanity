import assert from 'assert'
import {matchWorkspace, validateWorkspaceBasePaths} from '../matchWorkspace'

describe('validateWorkspaceBasePaths', () => {
  it('allows empty basePaths', () => {
    validateWorkspaceBasePaths({
      workspaces: [{name: 'foo', basePath: '/'}],
    })

    validateWorkspaceBasePaths({
      workspaces: [{name: 'foo', basePath: ''}],
    })

    validateWorkspaceBasePaths({
      workspaces: [{name: 'foo', basePath: undefined}],
    })
  })

  it('throws if a workspace has invalid characters', () => {
    expect(() => {
      validateWorkspaceBasePaths({
        workspaces: [{name: 'foo', basePath: '\tinvalid.characters%everywhere  '}],
      })
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must start with a leading \`/\`, consist of only URL safe characters, and cannot end with a trailing \`/\`. Workspace \`foo\`'s basePath is \`	invalid.characters%everywhere  \`"`
    )
  })

  it("throws if a workspace doesn't start with a leading `/`", () => {
    expect(() => {
      validateWorkspaceBasePaths({
        workspaces: [{name: 'foo', basePath: 'no-leading-slash'}],
      })
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must start with a leading \`/\`, consist of only URL safe characters, and cannot end with a trailing \`/\`. Workspace \`foo\`'s basePath is \`no-leading-slash\`"`
    )
  })

  it('throws if a workspace has a trailing `/`', () => {
    expect(() => {
      validateWorkspaceBasePaths({
        workspaces: [{name: 'foo', basePath: '/has-trailing-slash/'}],
      })
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must start with a leading \`/\`, consist of only URL safe characters, and cannot end with a trailing \`/\`. Workspace \`foo\`'s basePath is \`/has-trailing-slash/\`"`
    )
  })

  it('allows base paths with a leading `/`, URL safe characters, and no trailing slash', () => {
    validateWorkspaceBasePaths({
      workspaces: [{name: 'foo', basePath: '/valid'}],
    })

    validateWorkspaceBasePaths({
      workspaces: [{name: 'foo', basePath: '/also/valid'}],
    })

    validateWorkspaceBasePaths({
      workspaces: [{name: 'foo', basePath: '/still-valid'}],
    })
  })

  it('throws if workspace base paths have differing segment counts', () => {
    expect(() => {
      validateWorkspaceBasePaths({
        workspaces: [
          {name: 'twoSegments', basePath: '/one/two'},
          {name: 'threeSegments', basePath: '/one/two/three'},
        ],
      })
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must have the same amount of segments. Workspace \`twoSegments\` had 2 segments \`/one/two\` but workspace \`threeSegments\` had 3 segments \`/one/two/three\`"`
    )
  })

  it('throws if workspaces have identical base paths', () => {
    expect(() => {
      validateWorkspaceBasePaths({
        workspaces: [
          {name: 'foo', basePath: '/one/two'},
          {name: 'bar', basePath: '/foo/bar'},
          {name: 'fooAgain', basePath: '/OnE/TwO'},
        ],
      })
    }).toThrowErrorMatchingInlineSnapshot(
      `"\`basePath\`s must be unique. Workspaces \`foo\` and \`fooAgain\` both have the \`basePath\` \`/one/two\`"`
    )
  })
})

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
