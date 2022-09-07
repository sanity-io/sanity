/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('image types', () => {
  describe('defineType', () => {
    it('should define image schema', () => {
      const imageDef = defineType({
        type: 'image',
        name: 'custom-image',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () =>
          Promise.resolve({
            crop: {
              left: 1,
            },
          }),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom((value) => (value?.hotspot?.height ?? 0 > 2 ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan does not exist on imageRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        // TODO
        fields: [],
        options: {
          collapsed: true,
          collapsible: true,
          columns: 2,
          metadata: ['blurhash', 'lqip', 'palette', 'exif', 'location'],
          hotspot: true,
          storeOriginalFilename: true,
          accept: 'yolo/files',
          sources: [{name: 'source', title: 'Source', icon: () => null, component: () => null}],
        },
      })

      const assignableToimage: Schema.ImageDefinition = imageDef

      // @ts-expect-error image is not assignable to string
      const notAssignableToString: Schema.StringDefinition = imageDef
    })
  })
})

export {}
