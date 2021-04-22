import {PlayIcon} from '@sanity/icons'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const initialValuesTest = {
  name: 'initialValuesTest',
  type: 'document',
  title: 'Initial values test',
  icon: PlayIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'String (initially set to "initial title")',
      initialValue: 'initial title',
    },
    {name: 'recursive', type: 'initialValuesTest'},
    {
      name: 'asyncString',
      type: 'string',
      title: 'Async string (initially set to "async string")',
      initialValue: () => Promise.resolve('async string'),
    },
    {
      name: 'simpleObject',
      title: 'Simple object',
      type: 'object',
      fields: [{name: 'field1', type: 'string'}],
      initialValue: {field1: 'initial field1!'},
    },
    {
      name: 'simpleAsyncObject',
      title: 'Simple async object',
      type: 'object',
      fields: [{name: 'field1', type: 'string'}],
      initialValue: () => Promise.resolve({field1: 'initial async field1!'}),
    },
    {
      name: 'primitiveValues',
      title: 'Primitive values',
      type: 'object',
      fields: [
        {name: 'someBoolean', type: 'boolean'},
        {name: 'someNumber', type: 'number'},
      ],
      initialValue: {
        someBoolean: false,
        someNumber: 42,
      },
    },
    {
      name: 'asyncObject',
      type: 'string',
      title: 'Async string (initially set to "async string")',
      initialValue: () => Promise.resolve('async string'),
    },
    {
      name: 'asyncArray',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'simpleObject',
          fields: [
            {name: 'title', type: 'string'},
            {
              name: 'primitiveValues',
              title: 'Primitive values',
              type: 'object',
              fields: [
                {name: 'title', type: 'string', initialValue: 'initial title!'},
                {
                  name: 'undefinedTest',
                  type: 'string',
                  description:
                    'This should not have an initial value since its been explicitly set to undefined by the initial value defined for the enclosing type ',
                  initialValue: 'initial title (should not a!',
                },
                {name: 'someBoolean', type: 'boolean'},
                {name: 'someNumber', type: 'number', initialValue: 43},
              ],
              initialValue: {
                someBoolean: true,
                undefinedTest: undefined,
                someNumber: 42, // this should override the inner initialValue
              },
            },
          ],
          initialValue: () => {
            return {
              _type: 'simpleObject',
              primitiveValues: {
                title: 'overridden initial value',
              },
            }
          },
        },
        {
          type: 'object',
          name: 'slowInitialValue',
          description: 'the initial title value here takes 3s to load',
          fields: [
            {
              name: 'title',
              type: 'string',
              initialValue: () => sleep(2000).then(() => 'Slow title'),
            },
          ],
        },
      ],
      initialValue: [
        {_type: 'simpleObject', title: 'initial 1', primitiveValues: {title: 'inner title'}},
        {_type: 'simpleObject', title: 'initial 2', primitiveValues: {title: 'inner title'}},
      ],
    },
  ],
}
