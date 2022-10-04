/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {GeopointDefinition, StringDefinition} from '../definition'
import {defineType, Schema} from '../types'

describe('geopoint types', () => {
  describe('defineType', () => {
    it('should define geopoint schema', () => {
      const geopointDef = defineType({
        type: 'geopoint',
        name: 'custom-geopoint',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () =>
          Promise.resolve({
            lat: 1,
            lng: 2,
            alt: 2,
          }),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom((value) => (value?.alt === 2 ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan does not exist on geopointRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
      })

      const assignableToGeopoint: GeopointDefinition = geopointDef

      // @ts-expect-error geopoint is not assignable to string
      const notAssignableToString: StringDefinition = geopointDef
    })
  })
})

export {}
