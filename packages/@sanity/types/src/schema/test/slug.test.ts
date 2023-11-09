/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {SlugDefinition, StringDefinition} from '../definition'
import {defineType} from '../types'

describe('slug types', () => {
  describe('defineType', () => {
    it('should define slug schema', () => {
      const slugDef = defineType({
        type: 'slug',
        name: 'custom-slug',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () => ({current: 'some-value'}),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom((value) => (value?.current ? true : 'Error'))
            .warning(),
          // @ts-expect-error greaterThan does not exist on slugRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        options: {
          //TODO test all permutations of options and ensure param contents
          isUnique: (slugValue, options) => slugValue.toLowerCase() === 'whatever',
          maxLength: 50,
          source: (doc, options) => 'title',
          slugify: (input, type) => input.toUpperCase(),
        },
      })

      const assignableToSlug: SlugDefinition = slugDef

      // @ts-expect-error slug is not assignable to string
      const notAssignableToString: StringDefinition = slugDef
    })
  })
})

export {}
