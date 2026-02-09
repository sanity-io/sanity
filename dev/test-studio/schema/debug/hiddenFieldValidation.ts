/**
 * Reproduction schema for https://github.com/sanity-io/sanity/issues/3937
 *
 * Issue: Hiding a field that has nested fields with validation prevents the
 * document from publishing because of validation errors.
 *
 * This schema demonstrates the problem where:
 * 1. A parent object field is hidden based on a condition
 * 2. The nested child fields have required validation
 * 3. Even though the parent is hidden, validation still runs on children
 * 4. This prevents publishing the document
 */
import {defineField, defineType} from 'sanity'

// Reusable nested object type with required fields
const titleObject = defineType({
  name: 'hiddenValidationTitleObject',
  type: 'object',
  title: 'Title Object',
  fields: [
    defineField({
      name: 'number',
      title: 'Number',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})

export const hiddenFieldValidationTypes = [
  titleObject,

  defineType({
    name: 'hiddenFieldValidationTest',
    type: 'document',
    title: 'Hidden Field Validation (#3937)',
    description:
      'Reproduction for issue #3937: Validation on hidden/nested fields prevents publishing',
    fields: [
      defineField({
        name: 'selectedTemplate',
        title: 'Select Template',
        type: 'string',
        description: 'Select a template to show its fields. Other templates will be hidden.',
        options: {
          list: [
            {title: 'Template A', value: 'templateA'},
            {title: 'Template B', value: 'templateB'},
            {title: 'None', value: 'none'},
          ],
          layout: 'radio',
        },
        initialValue: 'none',
      }),

      // Simple case: hidden object with required nested field
      defineField({
        name: 'simpleHiddenObject',
        title: 'Simple Hidden Object',
        type: 'object',
        description:
          'This object is hidden when "None" is selected, but validation still fails on the required nested field.',
        hidden: ({document}) => document?.selectedTemplate === 'none',
        fields: [
          defineField({
            name: 'requiredField',
            title: 'Required Field',
            type: 'string',
            description: 'This field is required',
            validation: (rule) => rule.required(),
          }),
        ],
      }),

      // Template A: Object with nested required fields
      defineField({
        name: 'templateA',
        title: 'Template A',
        type: 'object',
        description:
          'Hidden unless "Template A" is selected. Has nested required fields that cause validation errors even when hidden.',
        hidden: ({document}) => document?.selectedTemplate !== 'templateA',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().min(5)),
          }),
          defineField({
            name: 'subtitle',
            title: 'Subtitle',
            type: 'string',
            validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().min(5)),
          }),
          defineField({
            name: 'metadata',
            title: 'Metadata',
            type: 'object',
            fields: [
              defineField({
                name: 'author',
                title: 'Author',
                type: 'string',
                validation: (rule) => rule.required(),
              }),
              defineField({
                name: 'publishDate',
                title: 'Publish Date',
                type: 'date',
                validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required()),
              }),
            ],
          }),
        ],
      }),

      // Template B: Object using the nested custom type
      defineField({
        name: 'templateB',
        title: 'Template B',
        type: 'object',
        description:
          'Hidden unless "Template B" is selected. Uses a custom nested type with required fields.',
        hidden: ({document}) => document?.selectedTemplate !== 'templateB',
        fields: [
          defineField({
            name: 'heading',
            title: 'Heading',
            type: 'hiddenValidationTitleObject',
            description: 'Uses nested object type with required fields',
          }),
          defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            validation: (rule) => rule.required().min(10),
          }),
        ],
      }),

      // Array with hidden items containing validation
      defineField({
        name: 'conditionalArray',
        title: 'Conditional Array',
        type: 'array',
        description: 'Array items with conditional visibility and validation',
        of: [
          {
            type: 'object',
            name: 'arrayItem',
            title: 'Array Item',
            fields: [
              defineField({
                name: 'showDetails',
                title: 'Show Details',
                type: 'boolean',
                initialValue: false,
              }),
              defineField({
                name: 'details',
                title: 'Details',
                type: 'object',
                description: 'Hidden unless "Show Details" is checked, but validation still runs',
                hidden: ({parent}) => !parent?.showDetails,
                fields: [
                  defineField({
                    name: 'requiredDetail',
                    title: 'Required Detail',
                    type: 'string',
                    validation: (rule) => rule.required(),
                  }),
                  defineField({
                    name: 'requiredNumber',
                    title: 'Required Number',
                    type: 'number',
                    validation: (rule) => rule.required().positive(),
                  }),
                ],
              }),
            ],
          },
        ],
      }),

      // Deeply nested case
      defineField({
        name: 'deeplyNested',
        title: 'Deeply Nested Hidden Fields',
        type: 'object',
        description: 'Demonstrates validation issues with deeply nested hidden fields',
        hidden: ({document}) => document?.selectedTemplate === 'none',
        fields: [
          defineField({
            name: 'level1',
            title: 'Level 1',
            type: 'object',
            fields: [
              defineField({
                name: 'level2',
                title: 'Level 2',
                type: 'object',
                fields: [
                  defineField({
                    name: 'level3',
                    title: 'Level 3',
                    type: 'object',
                    fields: [
                      defineField({
                        name: 'deepRequiredField',
                        title: 'Deep Required Field',
                        type: 'string',
                        description:
                          'This deeply nested field is required and causes validation errors even when top-level parent is hidden',
                        validation: (rule, context) => {
                          return context?.hidden ? rule.skip() : rule.min(10)
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
    preview: {
      select: {
        template: 'selectedTemplate',
      },
      prepare({template}) {
        return {
          title: 'Hidden Field Validation Test',
          subtitle: `Template: ${template || 'None'}`,
        }
      },
    },
  }),
]
