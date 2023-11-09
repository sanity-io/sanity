/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {BooleanDefinition} from '../definition'
import {defineType} from '../types'

describe('boolean types', () => {
  describe('defineType', () => {
    it('should define boolean schema', () => {
      const booleanDef = defineType({
        type: 'boolean',
        name: 'custom-boolean',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () => Promise.resolve(true),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom(() => true)
            .warning(),
          // @ts-expect-error greaterThan does not exist on BooleanRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        options: {
          layout: 'checkbox',
        },
      })

      const assignableToBoolean: BooleanDefinition = booleanDef

      // @ts-expect-error boolean is not assignable to string
      const notAssignableToString: StringDefinition = booleanDef
    })
  })
})

export {}
