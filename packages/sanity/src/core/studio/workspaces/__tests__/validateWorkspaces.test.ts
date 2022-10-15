import {validateBasePaths, validateNames} from '../validateWorkspaces'

describe('validateBasePaths', () => {
  it('allows empty basePaths', () => {
    validateBasePaths([{name: 'foo', basePath: '/'}])
    validateBasePaths([{name: 'foo', basePath: ''}])
    validateBasePaths([{name: 'foo', basePath: undefined}])
  })

  it('throws if more than one workspace is defined, but one or more workspace does not have a basepath', () => {
    expect(() => {
      validateBasePaths([{name: 'first'}, {name: 'second', basePath: '/2nd'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"If more than one workspace is defined, every workspace must have a \`basePath\` defined. Workspace \`first\` is missing a \`basePath\`"`
    )

    expect(() => {
      validateBasePaths([{name: 'first', basePath: '/1st'}, {name: 'second'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"If more than one workspace is defined, every workspace must have a \`basePath\` defined. Workspace \`second\` is missing a \`basePath\`"`
    )

    expect(() => {
      validateBasePaths([
        {name: 'first', basePath: '/1st'},
        {name: 'second', basePath: ''},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"If more than one workspace is defined, every workspace must have a \`basePath\` defined. Workspace \`second\` has an invalid \`basePath\` (must be a non-empty string)"`
    )
  })

  it('throws if a workspace has invalid characters', () => {
    expect(() => {
      validateBasePaths([{name: 'foo', basePath: '\tinvalid.characters%everywhere  '}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must start with a leading \`/\`, consist of only URL safe characters, and cannot end with a trailing \`/\`. Workspace \`foo\`'s basePath is \`	invalid.characters%everywhere  \`"`
    )
  })

  it("throws if a workspace doesn't start with a leading `/`", () => {
    expect(() => {
      validateBasePaths([{name: 'foo', basePath: 'no-leading-slash'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must start with a leading \`/\`, consist of only URL safe characters, and cannot end with a trailing \`/\`. Workspace \`foo\`'s basePath is \`no-leading-slash\`"`
    )
  })

  it('throws if a workspace has a trailing `/`', () => {
    expect(() => {
      validateBasePaths([{name: 'foo', basePath: '/has-trailing-slash/'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must start with a leading \`/\`, consist of only URL safe characters, and cannot end with a trailing \`/\`. Workspace \`foo\`'s basePath is \`/has-trailing-slash/\`"`
    )
  })

  it('allows base paths with a leading `/`, URL safe characters, and no trailing slash', () => {
    validateBasePaths([{name: 'foo', basePath: '/valid'}])

    validateBasePaths([{name: 'foo', basePath: '/also/valid'}])

    validateBasePaths([{name: 'foo', basePath: '/still-valid'}])
  })

  it('throws if workspace base paths have differing segment counts', () => {
    expect(() => {
      validateBasePaths([
        {name: 'twoSegments', basePath: '/one/two'},
        {name: 'threeSegments', basePath: '/one/two/three'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must have the same amount of segments. Workspace \`twoSegments\` had 2 segments \`/one/two\` but workspace \`threeSegments\` had 3 segments \`/one/two/three\`"`
    )

    expect(() => {
      validateBasePaths([
        {name: 'noSegments', basePath: '/'},
        {name: 'oneSegment', basePath: '/one'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`basePath\`s must have the same amount of segments. Workspace \`noSegments\` had 0 segments \`/\` but workspace \`oneSegment\` had 1 segment \`/one\`"`
    )
  })

  it('throws if workspaces have identical base paths', () => {
    expect(() => {
      validateBasePaths([
        {name: 'foo', basePath: '/one/two'},
        {name: 'bar', basePath: '/foo/bar'},
        {name: 'fooAgain', basePath: '/OnE/TwO'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"\`basePath\`s must be unique. Workspaces \`foo\` and \`fooAgain\` both have the \`basePath\` \`/one/two\`"`
    )
  })
})

describe('validateNames', () => {
  it('allows missing name on single workspace', () => {
    validateNames([{basePath: '/'}])
    validateNames([{name: undefined, basePath: '/'}])
  })

  it('throws if more than one workspace is defined, but one or more workspace does not have a name', () => {
    expect(() => {
      validateNames([{basePath: '/first'}, {name: 'second', basePath: '/2nd'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspaces must have a \`name\`, unless only a single workspace is defined. Workspace at index 0 did not define a \`name\`."`
    )

    expect(() => {
      validateNames([
        {basePath: '/first', title: 'First'},
        {name: 'second', basePath: '/2nd'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspaces must have a \`name\`, unless only a single workspace is defined. Workspace at index 0 (titled \\"First\\") did not define a \`name\`."`
    )

    expect(() => {
      validateNames([{name: 'first', basePath: '/1st'}, {basePath: '/second'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspaces must have a \`name\`, unless only a single workspace is defined. Workspace at index 1 did not define a \`name\`."`
    )

    expect(() => {
      validateNames([
        {name: 'first', basePath: '/1st'},
        {basePath: '/second', title: 'Second'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspaces must have a \`name\`, unless only a single workspace is defined. Workspace at index 1 (titled \\"Second\\") did not define a \`name\`."`
    )

    expect(() => {
      validateNames([
        {name: 'first', basePath: '/1st'},
        {name: '', basePath: '/2nd'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspaces must have a \`name\`, unless only a single workspace is defined. Workspace at index 1 did not define a \`name\`."`
    )
  })

  it('throws if a workspace name has invalid characters', () => {
    expect(() => {
      validateNames([{name: '/nope', basePath: '/niet'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`name\`s must consist of only a-z, 0-9, underscore and dashes, and cannot begin with an underscore or dash. Workspace at index 0 has the invalid name \`/nope\`"`
    )

    expect(() => {
      validateNames([{name: '/nope', basePath: '/niet', title: 'Nei'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`name\`s must consist of only a-z, 0-9, underscore and dashes, and cannot begin with an underscore or dash. Workspace at index 0 (titled \\"Nei\\") has the invalid name \`/nope\`"`
    )
  })

  it('throws if a workspace name leads with a dash/underscore', () => {
    expect(() => {
      validateNames([{name: '-no-leading-dash', basePath: '/okay'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`name\`s must consist of only a-z, 0-9, underscore and dashes, and cannot begin with an underscore or dash. Workspace at index 0 has the invalid name \`-no-leading-dash\`"`
    )

    expect(() => {
      validateNames([{name: '_no_leading_underscore', basePath: '/okay'}])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`name\`s must consist of only a-z, 0-9, underscore and dashes, and cannot begin with an underscore or dash. Workspace at index 0 has the invalid name \`_no_leading_underscore\`"`
    )

    expect(() => {
      validateNames([
        {name: '_no_leading_underscore', basePath: '/okay', title: 'The Leading Underscore'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"All workspace \`name\`s must consist of only a-z, 0-9, underscore and dashes, and cannot begin with an underscore or dash. Workspace at index 0 (titled \\"The Leading Underscore\\") has the invalid name \`_no_leading_underscore\`"`
    )
  })

  it('allows base paths with a leading [a-z0-9], underscores and dashes', () => {
    validateNames([{name: 'valid', basePath: '/one'}])
    validateNames([{name: 'also-valid', basePath: '/two'}])
    validateNames([{name: 'even_this_is_valid', basePath: '/three'}])
    validateNames([{name: '2009-was-okay', basePath: '/four'}])
    validateNames([{name: 'however_2020_was_not', basePath: '/five'}])
    validateNames([{name: 'even_m1x3d-but_dont-do_it', basePath: '/six'}])
  })

  it('throws if workspaces have identical names paths', () => {
    expect(() => {
      validateNames([
        {name: 'Foo', basePath: '/1st'},
        {name: 'bar', basePath: '/2nd'},
        {name: 'foO', basePath: '/3rd'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"\`name\`s must be unique. Workspace at index 0 and workspace at index 2 both have the \`name\` \`foO\`"`
    )

    expect(() => {
      validateNames([
        {name: 'bAr', basePath: '/1st', title: 'First'},
        {name: 'bar', basePath: '/2nd', title: 'Second'},
        {name: 'foO', basePath: '/3rd', title: 'Third'},
      ])
    }).toThrowErrorMatchingInlineSnapshot(
      `"\`name\`s must be unique. Workspace at index 0 (titled \\"First\\") and workspace at index 1 (titled \\"Second\\") both have the \`name\` \`bar\`"`
    )
  })
})
