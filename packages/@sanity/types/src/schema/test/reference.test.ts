/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('reference types', () => {
  describe('defineType', () => {
    it('should define reference schema', () => {
      const referenceDef = defineType({
        type: 'reference',
        name: 'custom-reference',
        title: 'Custom PTE',
        icon: () => null,
        description: 'Description',
        initialValue: () => Promise.resolve({_ref: 'yolo'}),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom((value) => (value?._ref?.toLowerCase() ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan does not exist on referenceRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
        weak: true,
        to: [{type: 'crewMember'}],
        options: {
          disableNew: false,
          //todo make tests for all variants
          filter: ({document, parent, parentPath}) =>
            Promise.resolve({
              filter: '*[field==$param]',
              params: {
                param: document._type,
              },
            }),
          filterParams: {
            param: 'is this an override?',
          },
        },
      })

      const assignableToreference: Schema.ReferenceDefinition = referenceDef

      // @ts-expect-error reference is not assignable to boolean
      const notAssignableToBoolean: Schema.BooleanDefinition = stringDef
    })
  })
})

export {}
