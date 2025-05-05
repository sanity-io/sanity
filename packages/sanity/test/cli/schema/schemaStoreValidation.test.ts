import {describe, expect, test} from 'vitest'

import {
  parseId,
  parseIds,
  parseTag,
  parseWorkspaceSchemaId,
} from '../../../src/_internal/cli/actions/schema/utils/schemaStoreValidation'

const workspaceIdCases = [
  {
    input: '_.schemas.testWorkspace',
    output: {
      schemaId: '_.schemas.testWorkspace',
      workspace: 'testWorkspace',
    },
    expectedErrors: [],
  },
  {
    input: '_.schemas.testWorkspace.tag.someTag',
    output: {
      schemaId: '_.schemas.testWorkspace.tag.someTag',
      workspace: 'testWorkspace',
    },
    expectedErrors: [],
  },
  {
    input: '_.schemas.testWorkspace-.123',
    output: undefined,
    expectedErrors: [
      'id must either match _.schemas.<workspaceName> or ' +
        '_.schemas.<workspaceName>.tag.<tag> but found: "_.schemas.testWorkspace-.123". ' +
        'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
    ],
  },
  {
    input: '_.schemas.testWorkspace-_123',
    output: {
      schemaId: '_.schemas.testWorkspace-_123',
      workspace: 'testWorkspace-_123',
    },
    expectedErrors: [],
  },
  {
    input: '_.schemas.abc%&/',
    output: undefined,
    expectedErrors: [
      'id can only contain characters in [a-zA-Z0-9._-] but found: "_.schemas.abc%&/"',
    ],
  },
  {
    input: 'prefixed._.schemas',
    output: undefined,
    expectedErrors: [
      'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "prefixed._.schemas". ' +
        'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
    ],
  },
  {
    input: '_.schemas',
    output: undefined,
    expectedErrors: [
      'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "_.schemas". ' +
        'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
    ],
  },
  {
    input: 'prefixed.testWorkspace',
    output: undefined,
    expectedErrors: [
      'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "prefixed.testWorkspace". ' +
        'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
    ],
  },
  {
    input: '_.schemas.testWorkspace.tag',
    output: undefined,
    expectedErrors: [
      'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "_.schemas.testWorkspace.tag". ' +
        'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
    ],
  },
  {
    input: '_.schemas.testWorkspace.tag.tag.with.dot',
    output: undefined,
    expectedErrors: [
      'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "_.schemas.testWorkspace.tag.tag.with.dot". ' +
        'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
    ],
  },
  {
    input: '-_.schemas.testWorkspace',
    output: undefined,
    expectedErrors: ['id cannot start with - (dash) but found: "-_.schemas.testWorkspace"'],
  },
  {
    input: '_.schemas..testWorkspace',
    output: undefined,
    expectedErrors: [
      'id cannot have consecutive . (period) characters, but found: "_.schemas..testWorkspace"',
    ],
  },
] as const

describe('schemaStoreValidation', () => {
  describe('parseWorkspaceSchemaId', () => {
    workspaceIdCases.forEach(({input, output, expectedErrors}) => {
      test(`${JSON.stringify(input)} -> ${JSON.stringify(output)}  (expectError: ${!!expectedErrors.length})`, () => {
        const errors: string[] = []
        const result = parseWorkspaceSchemaId(input, errors)
        expect(errors).toEqual(expectedErrors)
        expect(result).toEqual(output)
      })
    })
  })

  describe('parseId', () => {
    ;[
      {input: undefined, output: undefined, expectedErrors: []},
      {input: '', output: undefined, expectedErrors: ['id argument is empty']},
      {
        input: '  ',
        output: undefined,
        expectedErrors: ['id can only contain characters in [a-zA-Z0-9._-] but found: ""'],
      },
      {
        input: ',',
        output: undefined,
        expectedErrors: ['id can only contain characters in [a-zA-Z0-9._-] but found: ","'],
      },
      ...workspaceIdCases,
    ].forEach(({input, output, expectedErrors}) => {
      test(`${JSON.stringify(input)} -> ${JSON.stringify(output)}  (expectError: ${!!expectedErrors.length})`, () => {
        const errors: string[] = []
        const result = parseId({id: input}, errors)
        expect(result).toEqual(output?.schemaId)
        expect(errors).toEqual(expectedErrors)
      })
    })
  })

  describe('parseIds', () => {
    ;[
      {
        input: '',
        output: [],
        expectedErrors: ['ids argument is empty'],
      },
      {
        input: ' ,   ',
        output: [],
        expectedErrors: ['ids contains no valid id strings'],
      },
      {
        input: '_.schemas.testWorkspace',
        output: [
          {
            schemaId: '_.schemas.testWorkspace',
            workspace: 'testWorkspace',
          },
        ],
        expectedErrors: [],
      },
      {
        input: '_.schemas.a,_.schemas.b',
        output: [
          {schemaId: '_.schemas.a', workspace: 'a'},
          {schemaId: '_.schemas.b', workspace: 'b'},
        ],
        expectedErrors: [],
      },
      {
        input: '  _.schemas.a ,       _.schemas.b',
        output: [
          {schemaId: '_.schemas.a', workspace: 'a'},
          {schemaId: '_.schemas.b', workspace: 'b'},
        ],
        expectedErrors: [],
      },
      {
        input: '_.schemas.a, _.schemas.abc%&/',
        output: [{schemaId: '_.schemas.a', workspace: 'a'}],
        expectedErrors: [
          'id can only contain characters in [a-zA-Z0-9._-] but found: "_.schemas.abc%&/"',
        ],
      },
      {
        input:
          'prefixed._.schemas,' +
          '_.schemas.testWorkspace.tag,' +
          '-_.schemas.testWorkspace,' +
          '_.schemas..testWorkspace,' +
          '_.schemas.abc%&/',
        output: [],
        expectedErrors: [
          'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "prefixed._.schemas". ' +
            'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
          'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "_.schemas.testWorkspace.tag". ' +
            'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
          'id cannot start with - (dash) but found: "-_.schemas.testWorkspace"',
          'id cannot have consecutive . (period) characters, but found: "_.schemas..testWorkspace"',
          'id can only contain characters in [a-zA-Z0-9._-] but found: "_.schemas.abc%&/"',
        ],
      },
      {
        //this test case checks that we dont get the "ids contains no valid id strings" if there is any other error
        input: '_.schemas',
        output: [],
        expectedErrors: [
          'id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "_.schemas". ' +
            'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
        ],
      },
    ].forEach(({input, output, expectedErrors}) => {
      test(`${JSON.stringify(input)} -> ${JSON.stringify(output)} (expectError: ${!!expectedErrors.length})`, () => {
        const errors: string[] = []
        const result = parseIds({ids: input}, errors)
        expect(result).toEqual(output)
        expect(errors).toEqual(expectedErrors)
      })
    })
  })

  describe('parseTag', () => {
    ;[
      {input: 'prefix', output: 'prefix', expectedErrors: []},
      {
        input: 'prefix.with.periods',
        output: undefined,
        expectedErrors: ['tag cannot contain . (period), but was: "prefix.with.periods"'],
      },
      {input: undefined, output: undefined, expectedErrors: []},
      {input: '', output: undefined, expectedErrors: ['tag argument is empty']},
      {
        input: '-',
        output: undefined,
        expectedErrors: ['tag cannot start with - (dash) but was: "-"'],
      },
      {
        input: '.',
        output: undefined,
        expectedErrors: ['tag cannot contain . (period), but was: "."'],
      },
      {
        input: 'prefix..thing',
        output: undefined,
        expectedErrors: ['tag cannot contain . (period), but was: "prefix..thing"'],
      },
      {
        input: 'prefix%',
        output: undefined,
        expectedErrors: ['tag can only contain characters in [a-zA-Z0-9_-], but was: "prefix%"'],
      },
    ].forEach(({input, output, expectedErrors}) => {
      test(`${JSON.stringify(input)} -> ${JSON.stringify(output)} (expectError: ${!!expectedErrors.length})`, () => {
        const errors: string[] = []
        const result = parseTag({tag: input}, errors)
        expect(errors).toEqual(expectedErrors)
        expect(result).toEqual(output)
      })
    })
  })
})
