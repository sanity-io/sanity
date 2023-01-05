/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {ArrayDefinition, BooleanDefinition} from '../definition'
import {defineArrayMember, defineField, defineType} from '../types'

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
            // concession: making arrayDefinition generic to its value type
            // is possible but we would have to make the 'of' property optional on all types in the defineType signature.
            // That seemed less ideal than having to type custom value here,
            // so the implementation was dropped
            .custom((value?: string[]) =>
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
          {
            type: 'string',
            name: 'suffix2',
            title: 'Titled',
            // when we dont use defineArrayMember, validation cannot be inferred and falls back to generic rule
            // @ts-expect-error value is unknown
            validation: (Rule) => Rule.custom((value) => (value?.toLowerCase() ? true : 'Error')),
          },
          defineArrayMember({
            type: 'string',
            name: 'suffix2',
            title: 'Titled',
            validation: (Rule) => Rule.custom((value) => (value?.toLowerCase() ? true : 'Error')),
          }),
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

      let assignableToArray: ArrayDefinition = arrayDef
      assignableToArray = defineType(assignableToArray)

      // @ts-expect-error string is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = arrayDef
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
          defineArrayMember({
            type: 'object',
            name: 'inline-object-via-define',
            fields: [
              {
                type: 'string',
                name: 'field',
              },
            ],
          }),
          {
            type: 'object',
            name: 'inline-object',

            fields: [
              {
                type: 'string',
                name: 'field',
              },
            ],
          },
          {
            type: 'reference',
            to: [{type: 'castMember'}, {type: 'crewMember'}],
          },
          {
            type: 'aliased-type',
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

          //@ts-expect-error unknown prop
          allowUnknownOptions: false,
        },
      })

      let assignableToArray: ArrayDefinition = arrayDef
      assignableToArray = defineType(assignableToArray)

      // @ts-expect-error string is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = arrayDef
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

  it('should support tag layout', () => {
    const arrayField: ArrayDefinition = defineField({
      type: 'array',
      name: 'arrayTagList',
      description: 'array with tag-list',
      of: [{type: 'string'}],
      options: {
        list: ['1'],
        layout: 'tags',
      },
    })
  })

  it('should support Rule.valueOfField calls inside defineField', () => {
    const arrayField: ArrayDefinition = defineField({
      type: 'array',
      name: 'defineField-defined',
      description: 'field defined with defineField, containing validation using Rule.valueOfField',
      of: [{type: 'string'}],
      validation: (Rule) => {
        const fieldRef = Rule.valueOfField('some-other-field')
        return Rule.min(fieldRef).max(fieldRef).length(fieldRef)
      },
    })
  })
})

export {}
