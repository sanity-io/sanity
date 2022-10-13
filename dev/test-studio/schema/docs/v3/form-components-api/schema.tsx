import React from 'react'
import {defineType} from 'sanity'
import {structureGroupOptions} from '../../../../structure/groupByOption'
import {
  FormInput,
  CustomField,
  CustomInput,
  CustomPreview,
  CustomItem,
  CustomDiff,
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
      name: 'arrayOfObjects',
      title: 'Array of objects',
      type: 'array',
      components: {
        // diff: (props) => <CustomDiff {...props} />, // Don't work
        input: (props) => <CustomInput {...props} testId="input-schema-array-objects" />,
        field: (props) => <CustomField {...props} testId="field-schema-array-objects" />,
      },
      of: [
        {
          type: 'object',
          components: {
            // diff: (props) => <CustomDiff {...props} />, // Don't work
            input: (props) => <CustomInput {...props} testId="input-schema-array-input-object" />,
            field: (props) => <CustomField {...props} testId="field-schema-array-field-object" />,
            item: (props) => <CustomItem {...props} testId="field-schema-array-item-object" />,
            preview: (props) => <CustomPreview {...props} />,
          },
          fields: [
            {
              type: 'string',
              name: 'testString',
              title: 'String',
              components: {
                diff: (props) => <CustomDiff {...props} />,
                // diff: (props) => {
                //   return (
                //     <div style={{border: '4px solid orange'}}>{props.renderDefault(props)}</div>
                //   )
                // },
              },
            },
            {
              type: 'image',
              name: 'testImage',
              title: 'Image',
              components: {
                diff: (props) => <CustomDiff {...props} />,
                // diff: (props) => {
                //   return <div style={{border: '4px solid green'}}>{props.renderDefault(props)}</div>
                // },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      name: 'body',
      title: 'Body',
      components: {
        // diff: (props) => <CustomDiff {...props} />, // Don't work
        input: (props) => <CustomInput {...props} testId="input-schema-pte" />,
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
            diff: (props) => <CustomDiff {...props} />,
          },
        },
      ],
    },
    {
      type: 'boolean',
      name: 'boolean',
      title: 'Boolean',
      description: 'Basic boolean',
      components: {
        field: (props) => <CustomField {...props} testId="field-schema-boolean" />,
        input: (props) => <CustomInput {...props} testId="input-schema-boolean" />,
        diff: (props) => <CustomDiff {...props} />,
      },
    },
    {
      type: 'string',
      name: 'string',
      title: 'String',
      description: 'Basic string',
      components: {
        field: (props) => <CustomField {...props} testId="field-schema-string" />,
        input: (props) => <CustomInput {...props} testId="input-schema-string" />,
        diff: (props) => <CustomDiff {...props} />,
      },
    },
    {
      type: 'reference',
      name: 'reference',
      title: 'Reference',
      description: 'Basic reference',
      components: {
        input: (props) => <CustomInput {...props} testId="input-schema-reference" />,
        field: (props) => <CustomField {...props} testId="field-schema-reference" />,
        diff: (props) => <CustomDiff {...props} />,
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
        input: (props) => <CustomInput {...props} testId="input-schema-image" />,
        field: (props) => <CustomField {...props} testId="field-schema-image" />,
        diff: (props) => <CustomDiff {...props} />,
      },
    },
    {
      type: 'array',
      title: 'Array of primitives',
      name: 'arrayOfPrimitives',
      components: {
        // diff: (props) => <CustomDiff {...props} />, // Don't work
        input: (props) => <CustomInput {...props} testId="input-schema-array-primitives" />,
        field: (props) => <CustomField {...props} testId="field-schema-array-primitives" />,
      },
      of: [
        {
          type: 'string',
          components: {
            diff: (props) => <CustomDiff {...props} />,
            input: (props) => (
              <CustomInput {...props} testId="input-schema-array-string-input-primitive" />
            ),
            field: (props) => (
              <CustomField {...props} testId="field-schema-array-string-field-primitive" />
            ),
            item: (props) => (
              <CustomItem {...props} testId="item-schema-array-string-item-primitive" />
            ),
          },
        },
        {
          type: 'number',
          components: {
            diff: (props) => <CustomDiff {...props} />,
            input: (props) => (
              <CustomInput {...props} testId="input-schema-array-number-input-primitive" />
            ),
            field: (props) => (
              <CustomField {...props} testId="field-schema-array-number-field-primitive" />
            ),
            item: (props) => (
              <CustomItem {...props} testId="field-schema-array-number-item-primitive" />
            ),
          },
        },
      ],
    },
  ],
})
