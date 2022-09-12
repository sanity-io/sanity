/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineField, defineType, Schema} from '../types'

describe('object types', () => {
  it('should define object schema', () => {
    const objectDef = defineType({
      type: 'object',
      name: 'custom-object',
      title: 'Custom',
      icon: () => null,
      description: 'Description',
      initialValue: () => Promise.resolve({title: 'some title'}),
      validation: (Rule) => [
        Rule.required()
          .required()
          .custom((value) => (value?.title === 'yolo' ? true : 'Error'))
          .warning(),
        // @ts-expect-error greaterThan does not exist on objectRule
        Rule.greaterThan(5).error(),
      ],
      hidden: () => false,
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
            //TODO is this actually supported on fieldset?
            modal: {type: 'dialog', width: 1},
          },
        },
      ],
      groups: [{name: 'group', title: 'Group title', icon: () => null, default: true}],
      preview: {select: {title: 'title', subtitle: 'title'}},
      //@ts-expect-error requires one field def
      fields: [],
    })

    const assignableToObject: Schema.ObjectDefinition = objectDef

    // @ts-expect-error object is not assignable to string
    const notAssignableToString: Schema.StringDefinition = objectDef
  })

  it('should define document fields safely (with some compromises without defineField)', () => {
    defineType({
      type: 'object',
      name: 'custom-object',
      //@ts-expect-error require one field
      fields: [],
    })

    defineType({
      type: 'object',
      name: 'custom-object',

      fields: [
        //@ts-expect-error {} not assignable to FieldDefinition
        {},
      ],
    })
  })

  defineType({
    type: 'object',
    name: 'custom-object',

    fields: [
      //@ts-expect-error name is missing
      {
        type: 'string',
      },
    ],
  })

  defineType({
    type: 'object',
    name: 'custom-object',

    fields: [
      {
        type: 'string',
        name: 'stringField',
      },
    ],
  })

  defineType({
    type: 'object',
    name: 'custom-object',

    fields: [
      {
        type: 'object',
        name: 'objectField',
        fields: [
          {
            type: 'object',
            //@ts-expect-error errors on unknown prop: message is a bit off in this case, but at least is an error
            unknown: '',
          },
        ],
      },
    ],
  })

  defineType({
    type: 'object',
    name: 'custom-object',

    fields: [
      {
        type: 'object',
        name: 'objectField',
        fields: [
          {
            type: 'string',
            name: 'stringField',
            title: 'Title',
            initialValue: 'string',
            // validation is unfortunately broadened to the generic-rule-with-all-functions here
            validation: (Rule) => Rule.greaterThan(5),
            options: {
              isHighlighted: true,
              direction: 'horizontal',
              unknown: 'without-a-wrapper-unknown-options-are-allowed',
            },
          },
        ],
      },
      defineField({
        type: 'object',
        name: 'defineFieldObject',
        fields: [
          defineField({
            type: 'string',
            name: 'stringField',
            title: 'Title',
            initialValue: 'string',
            //@ts-expect-error now this is not allowed as greaterThan is not in StringRule
            validation: (Rule) => Rule.greaterThan(5),
            options: {
              //@ts-expect-error isHighlighted is not allowed in this context
              isHighlighted: true,
              direction: 'horizontal',
              //if isHighlighted does not error, this will, but TypeScript only emits on the first errored field
              unknown: 'without-a-wrapper-unknown-options-are-allowed',
            },
          }),
        ],
      }),
    ],
  })
})

export {}
