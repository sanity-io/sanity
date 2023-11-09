/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {BooleanDefinition, ReferenceDefinition} from '../definition'
import {defineType} from '../types'

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
          filter: ({document, parent, parentPath}) =>
            Promise.resolve({
              filter: '*[field==$param]',
              params: {
                param: document._type,
              },
            }),
        },
      })

      const assignableToreference: ReferenceDefinition = referenceDef

      // @ts-expect-error reference is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = referenceDef
    })

    it('should allow reference without filter in options', () => {
      defineType({
        type: 'reference',
        name: 'custom-reference',
        title: 'Custom PTE',
        to: [{type: 'crewMember'}],
        options: {
          disableNew: false,
        },
      })
    })

    it('should not allow filterParams when filter is function', () => {
      defineType({
        type: 'reference',
        name: 'custom-reference',
        title: 'Custom PTE',
        to: [{type: 'crewMember'}],
        options: {
          //@ts-expect-error function is not assignable to string (when filterParams is provided, filter must be string)
          filter: () => ({}),
          filterParams: {not: 'allowed'},
        },
      })
    })

    it('should allow filterParams when filter is string', () => {
      defineType({
        type: 'reference',
        name: 'custom-reference',
        title: 'Custom PTE',
        to: [{type: 'crewMember'}],
        options: {
          filter: '*',
          filterParams: {is: 'allowed'},
        },
      })
    })
  })
})

export {}
