/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('number types', () => {
  describe('defineType', () => {
    it('should define number schema', () => {
      const numberDef = defineType({
        type: 'number',
        name: 'custom-number',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: 10,
        validation: (Rule) => [
          Rule.required()
            .required()
            .min(1)
            .max(2)
            .lessThan(5)
            .greaterThan(10)
            .integer()
            .precision(3)
            .positive()
            .negative()
            .custom((value) => (value?.toFixed(1) === '2.0' ? 'Error' : true))
            .warning(),
          // @ts-expect-error something does not exist on numberRule
          Rule.something(5).error(),
        ],
        hidden: () => false,
        options: {
          layout: 'radio',
          list: [2, 4],
          direction: 'vertical',
        },
      })

      const assignableToNumber: Schema.NumberDefinition = numberDef

      // @ts-expect-error number is not assignable to string
      const notAssignableToString: Schema.StringDefinition = numberDef
    })
  })
})

export {}
