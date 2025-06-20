import {describe, it} from 'vitest'

/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {BooleanDefinition} from '../src/schema/definition/type/boolean'
import type {UrlDefinition} from '../src/schema/definition/type/url'
import {defineType} from '../src/schema/types'

describe('url types', () => {
  describe('defineType', () => {
    it('should define url schema', () => {
      const urlDef = defineType({
        type: 'url',
        name: 'custom-url',
        title: 'Custom url',
        description: 'Description',
        placeholder: 'daff',
        initialValue: () => Promise.resolve('url'),
        validation: (Rule) => [
          Rule.required()
            .uri({
              scheme: 'https',
              allowCredentials: true,
              allowRelative: true,
              relativeOnly: false,
            })
            .custom((value) => (value?.toUpperCase() == 'SHOUT' ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan is not on urlRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
      })

      const assignableToUrl: UrlDefinition = urlDef

      // @ts-expect-error url is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = urlDef
    })
  })
})

export {}
