import {describe, expect, test} from 'vitest'

import {parseWorkspaceSchemaId} from '../../../src/_internal/cli/actions/schema/utils/schemaStoreValidation'

describe('parsWorkspaceSchemaId', () => {
  ;(
    [
      [
        'sanity.workspace.schema.testWorkspace',
        {
          schemaId: 'sanity.workspace.schema.testWorkspace',
          workspace: 'testWorkspace',
        },
      ],
      [
        'prefixed.sanity.workspace.schema.testWorkspace',
        {
          schemaId: 'prefixed.sanity.workspace.schema.testWorkspace',
          workspace: 'testWorkspace',
        },
      ],
      [
        'sanity.workspace.schema.testWorkspace-.123',
        {
          schemaId: 'sanity.workspace.schema.testWorkspace-.123',
          workspace: 'testWorkspace-.123',
        },
      ],
      ['sanity.workspace.schema.abc%&/', undefined],
      ['prefixed.sanity.workspace.schema', undefined],
      ['sanity.workspace.schema', undefined],
      ['prefixed.testWorkspace', undefined],
    ] as const
  ).forEach(([input, output]) => {
    test(`${input} -> ${JSON.stringify(output)}`, () => {
      const result = parseWorkspaceSchemaId(input, [])
      expect(result).toEqual(output)
    })
  })
})
