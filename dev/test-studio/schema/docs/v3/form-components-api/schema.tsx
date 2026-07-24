import {defineType} from 'sanity'

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
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        field: (props) => <CustomField {...props} testId="field-schema-boolean" />,
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        input: (props) => <CustomInput {...props} testId="input-schema-boolean" />,
      },
    },
    {
      type: 'string',
      name: 'string',
      title: 'String',
      description: 'Basic string',
      components: {
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        field: (props) => <CustomField {...props} testId="field-schema-string" />,
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        input: (props) => <CustomInput {...props} testId="input-schema-string" />,
      },
    },
    {
      type: 'reference',
      name: 'reference',
      title: 'Reference',
      description: 'Basic reference',
      components: {
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        input: (props) => <CustomInput {...props} testId="input-schema-reference" />,
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        field: (props) => <CustomField {...props} testId="field-schema-reference" />,
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
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        input: (props) => <CustomInput {...props} testId="input-schema-image" />,
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        field: (props) => <CustomField {...props} testId="field-schema-image" />,
      },
    },
    {
      type: 'array',
      title: 'Array of primitives',
      name: 'arrayOfPrimitives',
      components: {
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        input: (props) => <CustomInput {...props} testId="input-schema-array-primitives" />,
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        field: (props) => <CustomField {...props} testId="field-schema-array-primitives" />,
      },
      of: [
        {
          type: 'string',
          components: {
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            input: (props) => (
              <CustomInput {...props} testId="input-schema-array-string-input-primitive" />
            ),
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            field: (props) => (
              <CustomField {...props} testId="field-schema-array-string-field-primitive" />
            ),
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            item: (props) => (
              <CustomItem {...props} testId="item-schema-array-string-item-primitive" />
            ),
          },
        },
        {
          type: 'number',
          components: {
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            input: (props) => (
              <CustomInput {...props} testId="input-schema-array-number-input-primitive" />
            ),
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            field: (props) => (
              <CustomField {...props} testId="field-schema-array-number-field-primitive" />
            ),
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            item: (props) => (
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
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        input: (props) => <CustomInput {...props} testId="input-schema-array-objects" />,
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        field: (props) => <CustomField {...props} testId="field-schema-array-objects" />,
      },
      of: [
        {
          type: 'object',
          components: {
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            input: (props) => <CustomInput {...props} testId="input-schema-array-input-object" />,
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            field: (props) => <CustomField {...props} testId="field-schema-array-field-object" />,
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            item: (props) => <CustomItem {...props} testId="field-schema-array-item-object" />,
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            preview: (props) => <CustomPreview {...props} />,
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
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        input: (props) => <CustomInput {...props} testId="input-schema-pte" />,
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        field: (props) => <CustomField {...props} testId="field-schema-pte" />,
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
