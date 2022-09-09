/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineField, defineType, Schema, typed} from '../types'
import AssetFieldOptions = Schema.AssetFieldOptions

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

    const assignableToimage: Schema.ImageDefinition = imageDef

    // @ts-expect-error image is not assignable to string
    const notAssignableToString: Schema.StringDefinition = imageDef
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
          fields: [],
          validation: (Rule) => Rule.max(45),
          initialValue: 'string',
          options: {
            layout: 'whatever',
            anything: 'goes',
            isHighlighted: true,
          },
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
            layout: 'whatever',
            slugify: () => 'all bets a re of',
            isHighlighted: true,
          },
        },
        {
          type: 'object',
          name: 'customInlineObject',
          initialValue: {nestedField: 'value'},
          fields: [
            //@ts-expect-error not assignable to FieldDefinition
            {},
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
              options: typed<AssetFieldOptions & Schema.StringOptions>({
                isHighlighted: true,

                //@ts-expect-error wrapping with defineField will give narrowed types always
                unknownProp: 'strict: so not allowed',
              }),
            }),
            defineField(
              {
                type: 'string',
                name: 'nestedWiden',
                options: {
                  isHighlighted: true,

                  //@ts-expect-error wrapping with defineField will give narrowed types always
                  unknownProp: 'strict: so not allowed',
                },
              },
              {imageField: true}
            ),
          ],
        },
        defineField({
          type: 'string',
          name: 'stringField',
          title: 'String',
          readOnly: true,
          hidden: false,
          // boy would typesafe fieldset be cool
          fieldset: 'test',
          group: 'test',
          options: typed<Schema.AssetFieldOptions & Schema.StringOptions>({
            layout: 'radio',
            // added by widen
            isHighlighted: true,
            //@ts-expect-error explicit typing prevents this
            unknownProp: 'strict: widen interface',
          }),
        }),
      ],
    })

    let assignableToImage: Schema.ImageDefinition = imageDef
    assignableToImage = defineType(imageDef)
    const fieldsType = imageDef.fields
  })
})

export {}
