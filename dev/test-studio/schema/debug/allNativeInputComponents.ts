import {defineField, defineType, PortableTextInput} from 'sanity'
import {
  DelegatedArrayOfObjectsInput,
  DelegatedArrayOfOptionsInput,
  DelegatedArrayOfPrimitivesInput,
  DelegatedBooleanInput,
  DelegatedCrossDatasetReferenceInput,
  DelegatedDateInput,
  DelegatedDatetimeInput,
  DelegatedEmailInput,
  DelegatedFileInput,
  DelegatedImageInput,
  DelegatedNumberInput,
  DelegatedObjectInput,
  DelegatedPTEInput,
  DelegatedReferenceInput,
  DelegatedSelectInput,
  DelegatedSlugInput,
  DelegatedStringInput,
  DelegatedTagsArrayInput,
  DelegatedTelephoneInput,
  DelegatedTextInput,
  DelegatedUniversalArrayInput,
  DelegatedUrlInput,
} from './components/DelegatedObjectInputs'

export const allNativeInputComponents = defineType({
  type: 'document',
  name: 'allNativeInputComponents',
  components: {
    input: DelegatedObjectInput,
  },
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      components: {
        input: DelegatedStringInput,
      },
    }),
    defineField({
      type: 'text',
      name: 'text',
      components: {
        input: DelegatedTextInput,
      },
    }),
    defineField({
      type: 'string',
      name: 'telephone',
      components: {
        input: DelegatedTelephoneInput,
      },
    }),
    defineField({
      type: 'string',
      name: 'select',
      components: {
        input: DelegatedSelectInput,
      },
      options: {
        list: ['a', 'b'],
      },
    }),
    defineField({
      type: 'url',
      name: 'url',
      components: {
        input: DelegatedUrlInput,
      },
    }),
    defineField({
      type: 'string',
      name: 'email',
      components: {
        input: DelegatedEmailInput,
      },
    }),
    defineField({
      type: 'boolean',
      name: 'boolean',
      components: {
        input: DelegatedBooleanInput,
      },
    }),
    defineField({
      type: 'date',
      name: 'date',
      components: {
        input: DelegatedDateInput,
      },
    }),
    defineField({
      type: 'datetime',
      name: 'datetime',
      components: {
        input: DelegatedDatetimeInput,
      },
    }),
    defineField({
      type: 'file',
      name: 'file',
      components: {
        input: DelegatedFileInput,
      },
    }),
    defineField({
      type: 'image',
      name: 'image',
      components: {
        input: DelegatedImageInput,
      },
    }),
    defineField({
      type: 'number',
      name: 'number',
      components: {
        input: DelegatedNumberInput,
      },
    }),
    defineField({
      type: 'reference',
      name: 'reference',
      to: [{type: 'allNativeInputComponents'}],
      components: {
        input: DelegatedReferenceInput,
      },
    }),
    defineField({
      type: 'crossDatasetReference',
      name: 'crossDatasetReference',
      dataset: 'test',
      to: [
        {
          type: 'allNativeInputComponents',
          preview: {select: {title: 'title'}},
          // eslint-disable-next-line camelcase
          __experimental_search: [{path: 'title'}],
        },
      ],
      components: {
        input: DelegatedCrossDatasetReferenceInput,
      },
    }),
    defineField({
      type: 'slug',
      name: 'slug',
      components: {
        input: DelegatedSlugInput,
      },
    }),
    defineField({
      type: 'object',
      name: 'object',
      fields: [
        defineField({
          type: 'string',
          name: 'title',
          components: {
            input: DelegatedStringInput,
          },
        }),
      ],
      components: {
        input: DelegatedObjectInput,
      },
    }),
    defineField({
      type: 'array',
      name: 'universalArray',
      of: [{type: 'allNativeInputComponents'}],
      components: {
        input: DelegatedUniversalArrayInput,
      },
    }),
    defineField({
      type: 'array',
      name: 'arrayOfOptions',
      of: [{type: 'allNativeInputComponents'}],
      components: {
        input: DelegatedArrayOfOptionsInput,
      },
      options: {
        list: [{_type: 'allNativeInputComponents'}],
      },
    }),
    defineField({
      type: 'array',
      name: 'primitivesArray',
      of: [{type: 'number'}],
      components: {
        input: DelegatedArrayOfPrimitivesInput,
      },
    }),
    defineField({
      type: 'array',
      name: 'tagsArray',
      of: [{type: 'string'}],
      components: {
        input: DelegatedTagsArrayInput,
      },
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      type: 'array',
      name: 'objectArray',
      of: [{type: 'allNativeInputComponents'}],
      components: {
        input: DelegatedArrayOfObjectsInput,
      },
    }),
    defineField({
      type: 'array',
      name: 'pte',
      of: [{type: 'block'}],
      components: {
        input: DelegatedPTEInput,
      },
    }),
  ],
})
