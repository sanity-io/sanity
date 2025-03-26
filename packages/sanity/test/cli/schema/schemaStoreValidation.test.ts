import {describe, expect, test} from 'vitest'

import {
  parseId,
  parseIdPrefix,
  parseIds,
  parseWorkspaceSchemaId,
} from '../../../src/_internal/cli/actions/schema/utils/schemaStoreValidation'

const workspaceIdCases = [
  {
    input: 'sanity.workspace.schema.testWorkspace',
    output: {
      schemaId: 'sanity.workspace.schema.testWorkspace',
      workspace: 'testWorkspace',
    },
    expectedErrors: [],
  },
  {
    input: 'prefixed.sanity.workspace.schema.testWorkspace',
    output: {
      schemaId: 'prefixed.sanity.workspace.schema.testWorkspace',
      workspace: 'testWorkspace',
    },
    expectedErrors: [],
  },
  {
    input: 'sanity.workspace.schema.testWorkspace-.123',
    output: {
      schemaId: 'sanity.workspace.schema.testWorkspace-.123',
      workspace: 'testWorkspace-.123',
    },
    expectedErrors: [],
  },
  {
    input: 'sanity.workspace.schema.abc%&/',
    output: undefined,
    expectedErrors: [
      'id can only contain characters in [a-zA-Z0-9._-] but found: "sanity.workspace.schema.abc%&/"',
    ],
  },
  {
    input: 'prefixed.sanity.workspace.schema',
    output: undefined,
    expectedErrors: [
      'id must end with sanity.workspace.schema.<workspaceName> but found: "prefixed.sanity.workspace.schema"',
    ],
  },
  {
    input: 'sanity.workspace.schema',
    output: undefined,
    expectedErrors: [
      'id must end with sanity.workspace.schema.<workspaceName> but found: "sanity.workspace.schema"',
    ],
  },
  {
    input: 'prefixed.testWorkspace',
    output: undefined,
    expectedErrors: [
      'id must end with sanity.workspace.schema.<workspaceName> but found: "prefixed.testWorkspace"',
    ],
  },
  {
    input: '-sanity.workspace.schema.testWorkspace',
    output: undefined,
    expectedErrors: [
      'id cannot start with - (dash) but found: "-sanity.workspace.schema.testWorkspace"',
    ],
  },
  {
    input: 'sanity.workspace.schema..testWorkspace',
    output: undefined,
    expectedErrors: [
      'id cannot have consecutive . (period) characters, but found: "sanity.workspace.schema..testWorkspace"',
    ],
  },
] as const

describe('schemaStoreValidation', () => {
  describe('parseWorkspaceSchemaId', () => {
    workspaceIdCases.forEach(({input, output, expectedErrors}) => {
      test(`${JSON.stringify(input)} -> ${JSON.stringify(output)}  (expectError: ${!!expectedErrors.length})`, () => {
        const errors: string[] = []
        const result = parseWorkspaceSchemaId(input, errors)
        expect(result).toEqual(output)
        expect(errors).toEqual(expectedErrors)
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
        input: 'sanity.workspace.schema.testWorkspace',
        output: [
          {
            schemaId: 'sanity.workspace.schema.testWorkspace',
            workspace: 'testWorkspace',
          },
        ],
        expectedErrors: [],
      },
      {
        input: 'sanity.workspace.schema.a,sanity.workspace.schema.b',
        output: [
          {schemaId: 'sanity.workspace.schema.a', workspace: 'a'},
          {schemaId: 'sanity.workspace.schema.b', workspace: 'b'},
        ],
        expectedErrors: [],
      },
      {
        input: '  sanity.workspace.schema.a ,       sanity.workspace.schema.b',
        output: [
          {schemaId: 'sanity.workspace.schema.a', workspace: 'a'},
          {schemaId: 'sanity.workspace.schema.b', workspace: 'b'},
        ],
        expectedErrors: [],
      },
      {
        input: 'sanity.workspace.schema.a, sanity.workspace.schema.abc%&/',
        output: [{schemaId: 'sanity.workspace.schema.a', workspace: 'a'}],
        expectedErrors: [
          'id can only contain characters in [a-zA-Z0-9._-] but found: "sanity.workspace.schema.abc%&/"',
        ],
      },
      {
        input:
          'prefixed.sanity.workspace.schema,' +
          '-sanity.workspace.schema.testWorkspace,' +
          'sanity.workspace.schema..testWorkspace,' +
          'sanity.workspace.schema.abc%&/',
        output: [],
        expectedErrors: [
          'id must end with sanity.workspace.schema.<workspaceName> but found: "prefixed.sanity.workspace.schema"',
          'id cannot start with - (dash) but found: "-sanity.workspace.schema.testWorkspace"',
          'id cannot have consecutive . (period) characters, but found: "sanity.workspace.schema..testWorkspace"',
          'id can only contain characters in [a-zA-Z0-9._-] but found: "sanity.workspace.schema.abc%&/"',
        ],
      },
      {
        //this test case checks that we dont get the "ids contains no valid id strings" if there is any other error
        input: 'prefixed.sanity.workspace.schema,',
        output: [],
        expectedErrors: [
          'id must end with sanity.workspace.schema.<workspaceName> but found: "prefixed.sanity.workspace.schema"',
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

  describe('parseIdPrefix', () => {
    ;[
      {input: 'prefix', output: 'prefix', expectedErrors: []},
      {input: 'prefix.with.periods', output: 'prefix.with.periods', expectedErrors: []},
      {input: undefined, output: undefined, expectedErrors: []},
      {input: '', output: undefined, expectedErrors: ['id-prefix argument is empty']},
      {
        input: '-',
        output: undefined,
        expectedErrors: ['id-prefix cannot start with - (dash) but was: "-"'],
      },
      {
        input: '.',
        output: undefined,
        expectedErrors: ['id-prefix argument cannot end with . (period), but was: "."'],
      },
      {
        input: 'prefix..thing',
        output: undefined,
        expectedErrors: [
          'id-prefix cannot have consecutive . (period) characters, but was: "prefix..thing"',
        ],
      },
      {
        input: 'prefix%',
        output: undefined,
        expectedErrors: [
          'id-prefix can only contain _id compatible characters [a-zA-Z0-9._-], but was: "prefix%"',
        ],
      },
    ].forEach(({input, output, expectedErrors}) => {
      test(`${JSON.stringify(input)} -> ${JSON.stringify(output)} (expectError: ${!!expectedErrors.length})`, () => {
        const errors: string[] = []
        const result = parseIdPrefix({'id-prefix': input}, errors)
        expect(result).toEqual(output)
        expect(errors).toEqual(expectedErrors)
      })
    })
  })
})
