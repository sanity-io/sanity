/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('file types', () => {
  describe('defineType', () => {
    it('should define file schema', () => {
      const fileDef = defineType({
        type: 'file',
        name: 'custom-file',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () =>
          Promise.resolve({
            asset: {
              _type: 'reference' as const, // TODO might be too strict to require const here
              _ref: 'hardcoded-file',
            },
            otherField: 'yolo',
          }),
        validation: (Rule) => [
          Rule.required()
            .required()
            // type is FileValue if not provided
            .custom((value) => (value?.asset?._ref === 'hardcoded' ? 'Error' : true))
            // we can override if we want though
            .custom((value: {narrow: string} | undefined) => (value?.narrow ? true : 'Error'))
            // @ts-expect-error must always narrow to undefined though, so this errors
            .custom((value: {narrow: boolean}) => (value?.narrow ? true : 'Error'))
            .warning(),
          // @ts-expect-error greaterThan does not exist on fileRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        options: {
          storeOriginalFilename: true,
          accept: 'application/msword',
          sources: [{name: 'source', title: 'Source', icon: () => null, component: () => null}],
        },
        //TODO typesafe field inference
        fields: [],
      })

      const assignableToFile: Schema.FileDefinition = fileDef

      // @ts-expect-error file is not assignable to string
      const notAssignableToString: Schema.StringDefinition = fileDef
    })
  })
})

export {}
