/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('block types', () => {
  describe('defineType', () => {
    it('should define block schema', () => {
      const blockDef = defineType({
        type: 'block',
        name: 'custom-block',
        title: 'Custom PTE',
        icon: () => null,
        description: 'Description',
        initialValue: () => Promise.resolve([]),
        validation: (Rule) => [
          Rule.required()
            .required()
            .custom((value) => (value?.filter((t) => !t).length === 1 ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan does not exist on BlockRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
        styles: [{title: 'Quote', value: 'blockquote'}],
        lists: [{title: 'Bullet', value: 'bullet'}],
        marks: {
          // TODO
          decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'},
            {
              title: 'Sup',
              value: 'sup',
              /*  blockEditor: {
                icon: () => null,
                render: ({children}) => children,
              },*/
            },
          ],
          // TODO need to type arrays of types correctly
          //annotations: [{name: 'author', title: 'Author', type: 'reference', to: {type: 'author'}}],
        },
        of: [{type: 'string'}],
        options: {
          spellCheck: true,
        },
      })

      const assignableToBlock: Schema.BlockDefinition = blockDef

      // @ts-expect-error block is not assignable to boolean
      const notAssignableToBoolean: Schema.BooleanDefinition = stringDef
    })
  })
})

export {}
