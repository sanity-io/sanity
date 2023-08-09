/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {FileDefinition, StringDefinition} from '_self_'
import {defineField, defineType} from '../types'

describe('file types', () => {
  describe('defineType', () => {
    it('should define file schema', () => {
      const fileDef = defineType({
        type: 'file',
        name: 'custom-file',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () =>
          Promise.resolve({
            asset: {
              _type: 'reference' as const,
              _ref: 'hardcoded-file',
            },
            otherField: 'yolo',
          }),
        validation: (Rule) => [
          Rule.required()
            .required()
            // type is FileValue if not provided
            .custom((value) => (value?.asset?._ref === 'hardcoded' ? 'Error' : true))
            // we can override if we want though
            .custom((value: {narrow: string} | undefined) => (value?.narrow ? true : 'Error'))
            // @ts-expect-error must always narrow to undefined though, so this errors
            .custom((value: {narrow: boolean}) => (value?.narrow ? true : 'Error'))
            .warning(),
          // @ts-expect-error greaterThan does not exist on fileRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        options: {
          storeOriginalFilename: true,
          accept: 'application/msword',
          sources: [{name: 'source', title: 'Source', icon: () => null, component: () => null}],
        },
        fields: [{type: 'string', name: 'string'}],
      })

      const assignableToFile: FileDefinition = fileDef

      // @ts-expect-error file is not assignable to string
      const notAssignableToString: StringDefinition = fileDef
    })
  })

  it('should define file fields safely (with some compromises without defineField)', () => {
    const fileDef = defineType({
      type: 'file',
      name: 'custom-file',
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
          //@ts-expect-error fields is not a known property for string types
          fields: [],
          validation: (Rule) => Rule.max(45),
          initialValue: 'string',
          options: {
            layout: 'whatever',
            anything: 'goes',
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
                layout: 'dropdown',
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
          // boy would typesafe fieldset be cool
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

    let assignableToFile: FileDefinition = fileDef
    assignableToFile = defineType(assignableToFile)
  })
})

export {}
