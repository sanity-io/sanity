/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {ImageDefinition} from '../definition'
import {defineField, defineType, Schema} from '../types'

describe('image types', () => {
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
            bottom: 0,
            right: 0,
            top: 0,
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

    const assignableToimage: ImageDefinition = imageDef

    // @ts-expect-error image is not assignable to string
    const notAssignableToString: StringDefinition = imageDef
  })

  it('should define image fields safely (with some compromises without defineField)', () => {
    const imageDef = defineType({
      type: 'image',
      name: 'custom-image',
      fields: [
        //@ts-expect-error not assignable to FieldDefinition
        {},
        {
          type: 'string',
          name: 'stringField',
          title: 'String',
          readOnly: true,
          hidden: false,
          fieldset: 'test',
          group: 'test',
          //fields: [],
          validation: (Rule) => Rule.max(45),
          initialValue: 'string',
          /*  options: {
            isHighlighted: true,
            layout: 'radio',
            //@ts-expect-error unknown option
            anything: 'goes',
          },*/
        },
        {
          type: 'array',
          name: 'arrayField',
          of: [{type: 'string'}],
        },
        {
          type: 'array',
          name: 'arrayField',
          of: [{type: 'object', fields: [{type: 'string', name: 'field'}]}],
        },
        {
          type: 'reference',
          name: 'arrayField',
          to: {type: 'string'},
        },
        {
          type: 'reference',
          name: 'arrayField',
          to: [{type: 'person'}],
        },
        {
          type: 'custom-type',
          name: 'customField',
          readOnly: true,
          hidden: false,
          options: {
            unknownOption: 'allowed',
          },
        },
        {
          type: 'object',
          name: 'customInlineObject',
          initialValue: {nestedField: 'value'},
          fields: [
            {
              type: 'string',
              name: 'nestedField',
              options: {
                layout: 'whatever',
                slugify: () => 'all bets are off',
              },
            },
            defineField({
              type: 'string',
              name: 'nestedField',
              options: {
                //@ts-expect-error wrapping with defineField will give narrowed types always
                unknownProp: 'strict: so not allowed',
              },
            }),
          ],
        },
        defineField({
          type: 'string',
          name: 'stringField',
          title: 'String',
          readOnly: true,
          hidden: false,
          fieldset: 'test',
          group: 'test',
          options: {
            layout: 'radio',
            //@ts-expect-error explicit typing prevents this
            unknownProp: 'strict: widen interface',
          },
        }),
      ],
    })

    let assignableToImage: ImageDefinition = imageDef
    assignableToImage = defineType(imageDef)
    const fieldsType = imageDef.fields
  })
})

export {}
