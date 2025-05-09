import {assertType, describe, test} from 'vitest'

import {type BaseSchemaTypeOptions} from '../src/schema/definition/type/common'
import {type DocumentDefinition} from '../src/schema/definition/type/document'

describe('SchemaType', () => {
  test('should  take canvas options in BaseSchemaTypeOptions', () => {
    assertType<BaseSchemaTypeOptions>({
      canvasApp: {
        exclude: false,
        purpose: 'this is a test',
      },
    })
  })
  test('should  take canvas options in document and fields', () => {
    assertType<DocumentDefinition>({
      name: 'test',
      type: 'document',
      fields: [
        {
          type: 'string',
          name: 'test',
          options: {
            canvasApp: {
              exclude: true,
            },
          },
        },
      ],
      options: {
        canvasApp: {
          exclude: false,
          purpose: 'this is a test',
        },
      },
    })
  })
})
