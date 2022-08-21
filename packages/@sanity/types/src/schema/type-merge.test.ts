import {defineType, Schema as S} from './types'

declare module './types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Schema {
    export type TypeAliasStringDefinition = Omit<StringDefinition, 'type'> & {
      type: 'alias-string'
      options: {
        alias: true
      }
    }

    /**
     * This adds 'alias-string' as an intrinsic type
     */
    export interface IntrinsicTypeDefinition {
      'alias-string': TypeAliasStringDefinition
    }

    /**
     * This adds a checkMerge option to StringOptions
     */
    export interface StringOptions {
      checkMerge?: 'must be this value when defined'
    }
  }
}

describe('types', () => {
  describe('defineType', () => {
    it('should have custom prop in string options', () => {
      defineType({
        type: 'string',
        name: 'custom-string',
        options: {
          //@ts-expect-error when this fails compilation, we know the checkMerge as correctly merged into StringOptions
          checkMerge: 'got this declaration merged StringOptions',
        },
      })
    })

    it('should have alias-string as an intrinsic type', () => {
      const aliasString = defineType({
        type: 'alias-string',
        name: 'custom-string',
        options: {
          //@ts-expect-error alias-string requires alias to be true
          alias: false,
          custom: 'got this declaration merged StringOptions',
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const assignableToAliasString: S.TypeAliasStringDefinition = aliasString

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const assignableToStringOptions: S.StringOptions = aliasString.options
    })
  })
})

export {}
