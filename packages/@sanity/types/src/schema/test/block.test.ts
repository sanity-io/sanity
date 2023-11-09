/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {BlockDefinition, BooleanDefinition} from '../definition'
import {defineArrayMember, defineField, defineType} from '../types'

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
          decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'},
            {
              title: 'Sup',
              value: 'sup',
              icon: () => null,
            },
          ],
          annotations: [
            {
              name: 'authorInline',
              title: 'Author',
              type: 'reference',
              to: {type: 'author'},
            },
            {type: 'author', initialValue: {}},
            {type: 'object', fields: [{name: 'title', type: 'string'}]},
          ],
        },
        of: [{type: 'string'}],
        options: {
          spellCheck: true,
        },
      })

      const assignableToBlock: BlockDefinition = blockDef

      // @ts-expect-error block is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = blockDef
    })
  })

  it('should define block field and arrayOf', () => {
    const field: BlockDefinition = defineField({
      type: 'block',
      name: 'pteField',
      title: 'Custom PTE',
      icon: () => null,
      styles: [{title: 'Quote', value: 'blockquote'}],
      lists: [{title: 'Bullet', value: 'bullet'}],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {
            title: 'Sup',
            value: 'sup',
            icon: () => null,
          },
        ],
        annotations: [{name: 'author', title: 'Author', type: 'reference', to: {type: 'author'}}],
      },
      of: [{type: 'string'}],
      options: {
        spellCheck: true,
      },
    })
    const arrayOf = defineArrayMember({
      type: 'block',
      name: 'pteField',
      title: 'Custom PTE',
      icon: () => null,
      styles: [{title: 'Quote', value: 'blockquote'}],
      lists: [{title: 'Bullet', value: 'bullet'}],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {
            title: 'Sup',
            value: 'sup',
            icon: () => null,
          },
        ],
        annotations: [{name: 'author', title: 'Author', type: 'reference', to: {type: 'author'}}],
      },
      of: [{type: 'string'}],
      options: {
        spellCheck: true,
      },
    })
  })

  it('should allow block fields in array defineType as inline definition', () => {
    defineType({
      type: 'array',
      name: 'pte',
      of: [
        {
          type: 'block',
          name: 'pte',
          styles: [{title: 'Quote', value: 'blockquote'}],
          lists: [{title: 'Bullet', value: 'bullet'}],
          marks: {
            decorators: [{title: 'Strong', value: 'strong'}],
            annotations: [
              {name: 'author', title: 'Author', type: 'reference', to: {type: 'author'}},
            ],
          },
        },
      ],
    })
  })
})

export {}
