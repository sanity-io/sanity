/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {BooleanDefinition, TextDefinition} from '../definition'
import {defineType} from '../types'

describe('text types', () => {
  describe('defineType', () => {
    it('should define text schema', () => {
      const textDef = defineType({
        type: 'text',
        name: 'custom-text',
        title: 'Custom text',
        description: 'Description',
        placeholder: 'fdsasfd',
        initialValue: () => Promise.resolve('text'),
        validation: (Rule) => [
          Rule.required()
            .min(1)
            .max(10)
            .length(10)
            .uppercase()
            .lowercase()
            .regex(/a+/, 'test', {name: 'yeah', invert: true})
            .regex(/a+/, {name: 'yeah', invert: true})
            .regex(/a+/, 'test')
            .regex(/a+/)
            .custom((value) => (value?.toUpperCase() == 'SHOUT' ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan is not on textRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
        options: {
          layout: 'radio',
          direction: 'horizontal',
          list: [{value: 'A', title: 'An entry'}],
        },
      })

      const assignableToText: TextDefinition = textDef

      // @ts-expect-error text is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = textDef
    })
  })
})

export {}
