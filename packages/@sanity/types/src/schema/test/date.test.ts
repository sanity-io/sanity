/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('date types', () => {
  describe('defineType', () => {
    it('should define date schema', () => {
      const dateDef = defineType({
        type: 'date',
        name: 'custom-date',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () => Promise.resolve('2021-01-01'),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom((value) => (value?.indexOf('2021-01-01') ?? -1 >= 0 ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan does not exist on dateRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        options: {
          calendarTodayLabel: 'Today',
          dateFormat: 'YYYY-MM-DD',
        },
      })

      const assignableToDate: Schema.DateDefinition = dateDef

      // @ts-expect-error date is not assignable to string
      const notAssignableToString: Schema.StringDefinition = dateDef
    })
  })
})

export {}
