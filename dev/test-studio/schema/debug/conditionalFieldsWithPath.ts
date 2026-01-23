import * as PathUtils from '@sanity/util/paths'
import {defineField, defineType} from 'sanity'

export const conditionallyHiddenField = defineType({
  name: 'conditionallyHiddenObject',
  type: 'object',
  title: 'Conditionally Hidden Object',
  description: 'Object with a conditionally hidden field',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title ',
      description: 'Title (hidden if path starts with "hiddenTitles")',
      hidden: ({path}) => {
        console.log('[Path Test] Conditionally Hidden Field - path:', JSON.stringify(path))
        if (PathUtils.startsWith(['hiddenTitles'], path)) {
          return true
        }
        return false
      },
    }),
    defineField({
      name: 'description',
      type: 'string',
      title: 'Description',
    }),
  ],
})

/**
 *
 * This schema demonstrates and tests the `path` property available in hidden/readOnly callbacks.
 * Each field logs its path to the console when the hidden callback is evaluated.
 */
export default defineType({
  name: 'conditionalFieldsWithPathTest',
  type: 'document',
  title: 'Conditional fields with path',
  fieldsets: [
    {
      name: 'settings',
      title: 'Settings',
    },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'Document title',
      hidden: ({path}) => {
        console.log('[Path Test] Title field - path:', JSON.stringify(path))
        return false
      },
    }),
    defineField({
      name: 'settings',
      type: 'object',
      title: 'Settings',
      fieldset: 'settings',
      fields: [
        {
          type: 'conditionallyHiddenObject',
          name: 'conditionallyHiddenObject',
        },
        {
          name: 'arrayOfObject',
          type: 'array',
          title: 'Array of Object',
          of: [
            {
              type: 'object',
              name: 'arrayOfObjectItem',
              title: 'Array of Object Item',
              fields: [
                {
                  name: 'objectWithConditionallyHiddenField',
                  type: 'conditionallyHiddenObject',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'options',
      type: 'object',
      title: 'Options',
      fields: [
        {
          type: 'conditionallyHiddenObject',
          name: 'conditionallyHiddenObject',
        },
        {
          name: 'arrayOfObject',
          type: 'array',
          title: 'Array of Object',
          of: [
            {
              type: 'object',
              name: 'arrayOfObjectItem',
              title: 'Array of Object Item',
              fields: [
                {
                  name: 'objectWithConditionallyHiddenField',
                  type: 'conditionallyHiddenObject',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'hiddenTitles',
      type: 'object',
      title: 'Hidden Titles',
      fields: [
        {
          type: 'conditionallyHiddenObject',
          name: 'conditionallyHiddenObject',
        },
        {
          name: 'arrayOfObject',
          type: 'array',
          title: 'Array of Object',
          of: [
            {
              type: 'object',
              name: 'arrayOfObjectItem',
              title: 'Array of Object Item',
              fields: [
                {
                  name: 'objectWithConditionallyHiddenField',
                  type: 'conditionallyHiddenObject',
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
})
