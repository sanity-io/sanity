import {describe, expect, it, jest} from '@jest/globals'
import {type SchemaValidationProblemGroup} from '@sanity/types'

import {formatSchemaValidation} from '../formatSchemaValidation'

// disables some terminal specific things that are typically auto detected
jest.mock('tty', () => ({isatty: () => false}))

describe('formatSchemaValidation', () => {
  it('formats incoming validation results', () => {
    const validation: SchemaValidationProblemGroup[] = [
      {
        path: [
          {kind: 'type', type: 'document', name: 'arraysTest'},
          {kind: 'property', name: 'fields'},
          {kind: 'type', type: 'array', name: 'imageArray'},
          {kind: 'property', name: 'of'},
          {kind: 'type', type: 'image'},
          {kind: 'property', name: 'fields'},
          {kind: 'type', type: 'string', name: '<unnamed_type_@_index_1>'},
        ],
        problems: [
          {
            severity: 'error',
            message: 'Missing field name',
            helpId: 'schema-object-fields-invalid',
          },
        ],
      },
      {
        path: [
          {kind: 'type', type: 'document', name: 'blocksTest'},
          {kind: 'property', name: 'fields'},
          {kind: 'type', type: 'string', name: '<unnamed_type_@_index_1>'},
        ],
        problems: [
          {
            severity: 'error',
            message: 'Missing field name',
            helpId: 'schema-object-fields-invalid',
          },
          {
            severity: 'error',
            message: 'Type is missing a type.',
            helpId: 'schema-type-missing-name-or-type',
          },
        ],
      },
      {
        path: [
          {kind: 'type', type: 'document', name: 'blocksTest'},
          {kind: 'property', name: 'fields'},
          {kind: 'type', type: 'array', name: 'defaults'},
        ],
        problems: [
          {
            severity: 'warning',
            message:
              'Found array member declaration with the same name as the global schema type "objectWithNestedArray". It\'s recommended to use a unique name to avoid possibly incompatible data types that shares the same name.',
            helpId: 'schema-array-of-type-global-type-conflict',
          },
        ],
      },
      {
        path: [
          {kind: 'type', type: 'document', name: 'pt_customMarkersTest'},
          {kind: 'property', name: 'fields'},
          {kind: 'type', type: 'array', name: 'content'},
          {kind: 'property', name: 'of'},
          {kind: 'type', type: 'block', name: 'block'},
        ],
        problems: [
          {
            severity: 'warning',
            message:
              'Decorator "boost" has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.',
            helpId: 'schema-deprecated-blockeditor-key',
          },
          {
            severity: 'warning',
            message:
              'Annotation has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.',
            helpId: 'schema-deprecated-blockeditor-key',
          },
          {
            severity: 'warning',
            message:
              'Style has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.',
            helpId: 'schema-deprecated-blockeditor-key',
          },
        ],
      },
    ]

    expect(formatSchemaValidation(validation)).toBe(
      `
[ERROR] [arraysTest]
  imageArray[<anonymous_image>].<unnamed_type_@_index_1>
    ✖ Missing field name

[ERROR] [blocksTest]
  <unnamed_type_@_index_1>
    ✖ Missing field name
    ✖ Type is missing a type.
  defaults
    ⚠ Found array member declaration with the same name as the global schema type "objectWithNestedArray". It's recommended to use a unique name to avoid possibly incompatible data types that shares the same name.

[WARN] [pt_customMarkersTest]
  content[block]
    ⚠ Decorator "boost" has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.
    ⚠ Annotation has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.
    ⚠ Style has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.
`.trim(),
    )
  })
})
