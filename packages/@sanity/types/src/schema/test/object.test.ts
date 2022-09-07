/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('object types', () => {
  describe('defineType', () => {
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
        //TODO
        fields: [],
      })

      const assignableToObject: Schema.ObjectDefinition = objectDef

      // @ts-expect-error object is not assignable to string
      const notAssignableToString: Schema.StringDefinition = objectDef
    })
  })
})

export {}
