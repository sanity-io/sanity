/**
 * Test case for GitHub issue #3782:
 * https://github.com/sanity-io/sanity/issues/3782
 *
 * This tests whether custom object types can be used directly as annotations
 * in portable text fields without wrapping them in another object.
 *
 * The issue reported that using a custom type directly in annotations array
 * caused errors, while inline object definitions or wrapped objects worked fine.
 *
 * FIX APPLIED:
 * Modified `isJSONTypeOf` in packages/\@sanity/schema/src/sanity/validation/utils/isJSONTypeOf.ts
 * to handle the case where custom types are referenced but not yet fully resolved during
 * schema validation traversal.
 */

import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A custom CTA (Call to Action) type defined at the schema level.
 * This type will be used directly as an annotation to test issue #3782.
 */
export const ctaType = defineType({
  name: 'ctaAnnotation',
  title: 'CTA',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Button Label',
      type: 'string',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})

/**
 * Another custom annotation type to test with more fields.
 */
export const tooltipAnnotationType = defineType({
  name: 'tooltipAnnotation',
  title: 'Tooltip',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Tooltip Text',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
  ],
})

/**
 * Test document that uses custom types directly as annotations.
 * This is the core test for issue #3782.
 */
export const annotationCustomTypeTest = defineType({
  name: 'annotationCustomTypeTest',
  title: 'Annotation Custom Type Test (Issue #3782)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),

    /**
     * TEST CASE 1: Using custom type directly as annotation
     *
     * This is what users want to do - reference a custom type directly in annotations.
     * It should work now.
     */
    defineField({
      name: 'bodyWithCustomAnnotation',
      title: 'Body with Custom Annotation Type (Issue #3782 Test)',
      description:
        'This field uses a custom type (ctaAnnotation) directly in the annotations array. ' +
        'This did not use to work. It should now work with the fix applied.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              // Using a custom type directly by name - should now work!
              {
                type: 'ctaAnnotation',
                name: 'cta',
                title: 'CTA Link',
              },
              // Using a custom type directly by name - should now work!
              {
                type: 'tooltipAnnotation',
                name: 'tooltip',
                title: 'Tooltip',
              },
            ],
          },
        }),
      ],
    }),

    // TEST CASE 2: Using inline object definition
    // This approach also works (always did)
    defineField({
      name: 'bodyWithInlineAnnotation',
      title: 'Body with Inline Annotation',
      description:
        'This field uses an inline object definition for annotation. ' +
        'This approach has always worked.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              // Inline definition
              {
                name: 'ctaInline',
                type: 'object',
                title: 'CTA Link (Inline)',
                fields: [
                  {
                    name: 'url',
                    title: 'URL',
                    type: 'url',
                  },
                  {
                    name: 'label',
                    title: 'Button Label',
                    type: 'string',
                  },
                ],
              },
            ],
          },
        }),
      ],
    }),

    // TEST CASE 3: Wrapped in another object
    // Another approach - custom type as a field inside an object
    defineField({
      name: 'bodyWithWrappedAnnotation',
      title: 'Body with Wrapped Annotation',
      description:
        'This field wraps the custom type reference as a field inside an object. ' +
        'This approach has always worked.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              // Wrapped in an object with the custom type as a field
              {
                name: 'ctaWrapper',
                type: 'object',
                title: 'CTA Link (Wrapped)',
                fields: [
                  {
                    name: 'cta',
                    title: 'CTA Details',
                    type: 'ctaAnnotation',
                  },
                ],
              },
            ],
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Annotation Custom Type Test',
        subtitle: 'Issue #3782 Test Case',
      }
    },
  },
})
