/* eslint-disable @typescript-eslint/no-unused-vars */
import {BooleanDefinition, EmailDefinition} from '../definition'
import {defineType} from '../types'

describe('email types', () => {
  describe('defineType', () => {
    it('should define email schema', () => {
      const emailDef = defineType({
        type: 'email',
        name: 'custom-email',
        title: 'Custom email',
        description: 'Description',
        placeholder: 'daff',
        initialValue: () => Promise.resolve('email'),
        validation: (Rule) => [
          Rule.required()
            .custom((value) => (value?.toUpperCase() == 'SHOUT' ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan is not on emailRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
      })

      const assignableToEmail: EmailDefinition = emailDef

      // @ts-expect-error email is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = emailDef
    })
  })
})

export {}
