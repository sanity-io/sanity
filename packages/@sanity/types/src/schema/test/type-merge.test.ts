/* eslint-disable @typescript-eslint/no-unused-vars */
import {defineType, Schema as S} from '../types'

declare module '../types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Schema {
    // here we type up our custom schema definition
    export type ExtensionTypeExampleDef = Omit<Schema.ObjectDefinition, 'type' | 'fields'> & {
      type: 'test-added-extension-type'
      options: {
        custom: true
      }
    }

    // Adds 'extension-type' as an intrinsic type
    export interface IntrinsicTypeDefinition {
      'test-added-extension-type': ExtensionTypeExampleDef
    }

    // This adds a checkMerge option to StringOptions
    export interface StringOptions {
      testAddedThis?: 'must be this value when defined'
    }
  }
}

describe('types', () => {
  describe('defineType', () => {
    it('should have custom prop in string options', () => {
      defineType({
        type: 'string',
        name: 'a-string-string',
        options: {
          testAddedThis: 'must be this value when defined',
        },
      })
    })

    it('should have extension-type as an intrinsic type', () => {
      const assignableToExtensionType: S.ExtensionTypeExampleDef = defineType({
        type: 'test-added-extension-type',
        name: 'uses-extension-type',
        options: {
          custom: true,
        },
      })
    })
  })
})

export {}
