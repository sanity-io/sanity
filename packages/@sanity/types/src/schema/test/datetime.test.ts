/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {DatetimeDefinition} from '../definition'
import {defineField, defineType} from '../types'

describe('datetime types', () => {
  describe('defineType', () => {
    it('should define datetime schema', () => {
      const datetimeDef = defineType({
        type: 'datetime',
        name: 'custom-datetime',
        title: 'Custom',
        placeholder: 'balba',
        icon: () => null,
        description: 'Description',
        initialValue: () => Promise.resolve('2021-01-01'),
        validation: (Rule) => [
          Rule.required()
            .min('2021-01-01')
            .max('2021-01-01')
            .required()
            .custom((value) => (value?.indexOf('2021-01-01') ?? -1 >= 0 ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan does not exist on DatetimeRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        options: {
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '10:10',
          timeStep: 2,
        },
      })

      const assignableToDatetime: DatetimeDefinition = datetimeDef

      // @ts-expect-error datetime is not assignable to string
      const notAssignableToString: StringDefinition = datetimeDef
    })
  })

  it('should support Rule.valueOfField calls inside defineField', () => {
    const datetimeField: DatetimeDefinition = defineField({
      type: 'datetime',
      name: 'defineField-defined',
      description: 'field defined with defineField, containing validation using Rule.valueOfField',
      validation: (Rule) => {
        const fieldRef = Rule.valueOfField('some-other-field')
        return Rule.min(fieldRef).max(fieldRef)
      },
    })
  })
})

export {}
