/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {DocumentDefinition, StringDefinition} from '../definition'
import {defineArrayMember, defineField, defineType} from '../types'

describe('document types', () => {
  describe('defineType', () => {
    it('should define document schema', () => {
      const documentDef = defineType({
        type: 'document',
        name: 'custom-document',
        title: 'Custom',
        icon: () => null,
        description: 'Description',
        initialValue: () => Promise.resolve({title: 'some title'}),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom((value) => (value?._createdAt ? true : 'Error'))
            .warning(),
          // @ts-expect-error greaterThan does not exist on documentRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        liveEdit: true,
        orderings: [{name: 'what', title: 'Order', by: [{field: 'title', direction: 'asc'}]}],
        fieldsets: [
          {
            name: 'fieldset',
            title: 'Fieldset',
            description: 'Fieldset description',
            hidden: false,
            readOnly: false,
            options: {
              collapsed: true,
              collapsible: true,
              columns: 2,
              modal: {type: 'dialog', width: 1},
            },
          },
        ],
        groups: [{name: 'group', title: 'Group title', icon: () => null, default: true}],
        preview: {
          select: {
            title: 'title',
            subtitle: 'title',
          },
          prepare: ({title, subtitle}) => {
            return {
              title,
              subtitle,
              description: subtitle,
              imageUrl: subtitle,
              media: () => null,
            }
          },
        },
        fields: [defineField({type: 'text', name: 'text'})],
      })

      const assignableToDocument: DocumentDefinition = documentDef

      // @ts-expect-error document is not assignable to string
      const notAssignableToString: StringDefinition = documentDef
    })

    it('should have typesafe preview.prepare keys', () => {
      defineType({
        type: 'document',
        name: 'custom-document',
        preview: {
          select: {
            fromSelect: 'a',
            thisOneToo: 'b',
          },
          //@ts-expect-error title and subtitle are not in fromSelect | thisOneToo
          prepare: ({title, subtitle}) => {
            return {title, subtitle}
          },
        },
        fields: [{type: 'string', name: 'string'}],
      })

      defineType({
        type: 'document',
        name: 'custom-document',
        preview: {
          select: {
            title: 'a',
            subtitle: 'b',
          },
          prepare: ({title, subtitle}) => {
            return {title, subtitle}
          },
        },
        fields: [{type: 'string', name: 'string'}],
      })

      defineType({
        type: 'document',
        name: 'custom-document',
        preview: {
          select: {
            title: 'a',
            subtitle: 'b',
          },
          // allows type narrowing values from any by providing an interface
          prepare: ({title}: {title: string}) => {
            return {title}
          },
        },
        fields: [{type: 'string', name: 'string'}],
      })

      defineType({
        type: 'document',
        name: 'custom-document',
        preview: {
          select: {
            title: 'a',
          },
          //@ts-expect-error notInSelect is missing in type Record<'title', any>
          prepare: ({notInSelect}: {notInSelect: string}) => {
            return {title: notInSelect}
          },
        },
        fields: [{type: 'string', name: 'string'}],
      })

      defineField({
        type: 'object',
        name: 'custom-object-field',
        preview: {
          select: {
            title: 'a',
            subtitle: 'b',
          },
          // allows type narrowing values from any by providing an interface
          prepare: ({title}: {title: string}) => {
            return {title}
          },
        },
        fields: [{type: 'string', name: 'string'}],
      })

      defineArrayMember({
        type: 'object',
        name: 'custom-array-object',
        preview: {
          select: {
            title: 'a',
            subtitle: 'b',
          },
          //@ts-expect-error notExists not in select keys
          prepare: ({notExists}) => {
            return {notExists}
          },
        },
        fields: [{type: 'string', name: 'string'}],
      })
    })

    it('should define document fields safely (with some compromises without defineField)', () => {
      defineType({
        type: 'document',
        name: 'custom-document',
        fields: [],
      })

      defineType({
        type: 'document',
        name: 'custom-document',
        fields: [
          //@ts-expect-error not assignable to FieldDefinition
          {},
        ],
      })

      defineType({
        type: 'document',
        name: 'custom-document',
        fields: [
          //@ts-expect-error not assignable to FieldDefinition
          {
            type: 'object',
            name: 'error-fields-type',
            fields: [{}],
          },
        ],
      })

      // happy day
      const documentDef = defineType({
        type: 'document',
        name: 'custom-document',
        fields: [
          {
            type: 'string',
            name: 'stringField',
            title: 'String',
            readOnly: true,
            hidden: false,
            fieldset: 'test',
            group: 'test',
            validation: (Rule) => Rule.max(45),
            initialValue: 'string',
            options: {
              layout: 'dropdown',
            },
          },
          {
            type: 'array',
            name: 'arrayField',
            of: [{type: 'string'}],
          },
          {
            type: 'alias-type',
            name: 'aliasType',
            initialValue: {something: 'false'},
            validation: (Rule) =>
              Rule.custom((value?: Record<string, string>) =>
                value?.something === 'false' ? true : 'Error',
              ),
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
            },
          },
          defineField({
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

                options: {
                  //@ts-expect-error wrapping with defineField will give narrowed types always
                  unknownProp: 'strict not allowed',
                },
              }),
              defineField(
                {
                  type: 'string',
                  name: 'nestedField',
                  options: {
                    unknownProp: 'strict: false so it is allowed',
                  },
                },
                {strict: false},
              ),
            ],
          }),
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
            },
          }),
        ],
      })

      let assignableToDocument: DocumentDefinition = documentDef
      assignableToDocument = defineType(documentDef)
      const fieldsType = documentDef.fields
    })
  })
})

export {}
