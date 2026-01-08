import {
  type ArrayOfObjectsInputProps,
  type FieldProps,
  type InputProps,
  type ItemProps,
  type PreviewProps,
  defineType,
} from 'sanity'

import {structureGroupOptions} from '../../../../structure/groupByOption'
import {
  ArrayWithCustomActions,
  CustomField,
  CustomInput,
  CustomItem,
  CustomPreview,
  FormInput,
} from './components'

export const formComponentsSchema = defineType({
  type: 'document',
  title: 'v3 form components',
  name: 'formComponentsApi',
  options: structureGroupOptions({
    structureGroup: 'v3',
  }),
  components: {
    input: FormInput,
  },
  fields: [
    {
      type: 'boolean',
      name: 'boolean',
      title: 'Boolean',
      description: 'Basic boolean',
      components: {
        field: (props: FieldProps) => <CustomField {...props} testId="field-schema-boolean" />,
        input: (props: InputProps) => <CustomInput {...props} testId="input-schema-boolean" />,
      },
    },
    {
      type: 'string',
      name: 'string',
      title: 'String',
      description: 'Basic string',
      components: {
        field: (props: FieldProps) => <CustomField {...props} testId="field-schema-string" />,
        input: (props: InputProps) => <CustomInput {...props} testId="input-schema-string" />,
      },
    },
    {
      type: 'reference',
      name: 'reference',
      title: 'Reference',
      description: 'Basic reference',
      components: {
        input: (props: InputProps) => <CustomInput {...props} testId="input-schema-reference" />,
        field: (props: FieldProps) => <CustomField {...props} testId="field-schema-reference" />,
      },
      to: [
        {
          type: 'author',
          components: {
            preview: CustomPreview,
          },
        },
      ],
    },
    {
      type: 'image',
      name: 'image',
      title: 'Image',
      description: 'Basic image',
      components: {
        input: (props: InputProps) => <CustomInput {...props} testId="input-schema-image" />,
        field: (props: FieldProps) => <CustomField {...props} testId="field-schema-image" />,
      },
    },
    {
      type: 'array',
      title: 'Array of primitives',
      name: 'arrayOfPrimitives',
      components: {
        input: (props: ArrayOfObjectsInputProps) => (
          <CustomInput {...props} testId="input-schema-array-primitives" />
        ),
        field: (props: FieldProps) => (
          <CustomField {...props} testId="field-schema-array-primitives" />
        ),
      },
      of: [
        {
          type: 'string',
          components: {
            input: (props: InputProps) => (
              <CustomInput {...props} testId="input-schema-array-string-input-primitive" />
            ),
            field: (props: FieldProps) => (
              <CustomField {...props} testId="field-schema-array-string-field-primitive" />
            ),
            item: (props: ItemProps) => (
              <CustomItem {...props} testId="item-schema-array-string-item-primitive" />
            ),
          },
        },
        {
          type: 'number',
          components: {
            input: (props: InputProps) => (
              <CustomInput {...props} testId="input-schema-array-number-input-primitive" />
            ),
            field: (props: FieldProps) => (
              <CustomField {...props} testId="field-schema-array-number-field-primitive" />
            ),
            item: (props: ItemProps) => (
              <CustomItem {...props} testId="field-schema-array-number-item-primitive" />
            ),
          },
        },
      ],
    },
    {
      name: 'arrayOfObjects',
      title: 'Array of objects',
      type: 'array',
      components: {
        input: (props: ArrayOfObjectsInputProps) => (
          <CustomInput {...props} testId="input-schema-array-objects" />
        ),
        field: (props: FieldProps) => (
          <CustomField {...props} testId="field-schema-array-objects" />
        ),
      },
      of: [
        {
          type: 'object',
          components: {
            input: (props: InputProps) => (
              <CustomInput {...props} testId="input-schema-array-input-object" />
            ),
            field: (props: FieldProps) => (
              <CustomField {...props} testId="field-schema-array-field-object" />
            ),
            item: (props: ItemProps) => (
              <CustomItem {...props} testId="field-schema-array-item-object" />
            ),
            preview: (props: PreviewProps) => (
              <CustomPreview {...props} testId="preview-schema-array-object" />
            ),
          },
          fields: [
            {
              type: 'string',
              name: 'testString',
              title: 'String',
            },
            {
              type: 'image',
              name: 'testImage',
              title: 'Image',
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      name: 'arrayWithCustomActions',
      components: {
        input: ArrayWithCustomActions,
      },
      of: [
        {
          type: 'string',
          name: 'testString',
        },
      ],
    },
    {
      type: 'array',
      name: 'body',
      title: 'Body',
      components: {
        input: (props: ArrayOfObjectsInputProps) => (
          <CustomInput {...props} testId="input-schema-pte" />
        ),
        field: (props: FieldProps) => <CustomField {...props} testId="field-schema-pte" />,
      },
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          components: {
            preview: CustomPreview,
          },
        },
      ],
    },
  ],
})
