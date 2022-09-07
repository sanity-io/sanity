/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('array types', () => {
  describe('defineType', () => {
    it('should define string array schema', () => {
      const arrayDef = defineType({
        type: 'array',
        name: 'custom-array',
        title: 'Custom array',
        description: 'Description',
        initialValue: () => Promise.resolve(['string']),
        validation: (Rule) => [
          Rule.required()
            .unique()
            .min(1)
            .max(10)
            .length(10)
            // value is typed to string[] \o/
            .custom((value) =>
              value?.length === 2 && value[0].toLowerCase() == 'yolo' ? 'Error' : true
            )
            .warning(),
          // @ts-expect-error greaterThan does not exist on ArrayRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
        of: [
          {type: 'string'},
          {type: 'string', name: 'suffix'},
          {type: 'string', name: 'suffix2', title: 'Titled'},
          {
            type: 'string',
            name: 'suffix2',
            title: 'Titled',
          },
        ],
        options: {
          layout: 'grid',
          sortable: true,
          list: [{value: 'A', title: 'An entry'}],
          modal: {
            type: 'popover',
            width: 'auto',
          },
          //allowUnknownOptions: true,
        },
      })

      const assignableToArray: Schema.ArrayDefinition = arrayDef
      const assignableToStringArray: Schema.StringArrayDefinition = arrayDef

      // @ts-expect-error string is not assignable to boolean
      const notAssignableToBoolean: Schema.BooleanDefinition = stringDef
    })

    it('should define object array schema', () => {
      const arrayDef = defineType({
        type: 'array',
        name: 'custom-array',
        title: 'Custom array',
        description: 'Description',
        initialValue: () => Promise.resolve([{title: 'thing'}]),
        validation: (Rule) => [
          Rule.required()
            .unique()
            .min(1)
            .max(10)
            .length(10)
            .custom((value) => (value?.length === 2 ? 'Error' : true))
            .warning(),
        ],
        hidden: () => false,
        readOnly: () => false,
        // type inference here is not great
        of: [
          {type: 'object', name: 'inline'},
          {
            type: 'reference',
            to: [{type: 'castMember'}, {type: 'crewMember'}],
          },
        ],
        options: {
          layout: 'grid',
          sortable: true,
          modal: {
            type: 'popover',
            width: 'auto',
          },
          list: [{value: {prop: 'string'}, title: 'An entry'}],

          //allowUnknownOptions: true,
        },
      })

      const assignableToArray: Schema.ArrayDefinition = arrayDef
      const assignableToObjectArray: Schema.ObjectArrayDefinition = arrayDef

      // @ts-expect-error string is not assignable to boolean
      const notAssignableToBoolean: Schema.BooleanDefinition = stringDef
    })
  })

  it('should allow inline object def in array-of-object', () => {
    defineType({
      type: 'array',
      name: 'custom-array',
      of: [
        {
          type: 'object',
          name: 'inline-object',
          title: 'Custom title',
          fields: [
            {
              type: 'boolean',
              name: 'checkYourself',
              title: 'Check me',
              options: {
                layout: 'switch',
              },
            },
          ],
        },
      ],
    })
  })

  it('should require string in list value for string array', () => {
    defineType({
      type: 'array',
      name: 'custom-array',
      of: [{type: 'string'}],
      options: {
        // @ts-expect-error value must be string
        list: [{value: true, title: 'An entry'}],
      },
    })
  })
})

export {}
