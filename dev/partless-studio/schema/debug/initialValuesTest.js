import {ArrowRightIcon} from '@sanity/icons'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const superlatives = {
  name: 'superlatives',
  type: 'object',
  fields: [
    {name: 'english', type: 'string', title: 'English'},
    {name: 'norwegian', type: 'string', title: 'Norwegian'},
    {name: 'swedish', type: 'string', title: 'Swedish', initialValue: 'Jättebra'},
  ],
}

const INITIAL_PORTABLE_TEXT_VALUE = [
  {
    _type: 'block',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'this ',
      },
      {
        _type: 'span',
        marks: ['strong'],
        text: 'is',
      },
      {
        _type: 'span',
        marks: [],
        text: ' the ',
      },
      {
        _type: 'span',
        marks: ['em'],
        text: 'initial',
      },
      {
        _type: 'span',
        marks: [],
        text: ' portable ',
      },
      {
        _type: 'span',
        marks: ['underline'],
        text: 'text',
      },
      {
        _type: 'span',
        marks: [],
        text: ' value',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
  {
    _type: 'block',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'foo',
      },
    ],
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    style: 'normal',
  },
  {
    _type: 'block',
    children: [
      {
        _type: 'span',
        marks: ['code'],
        text: 'bar',
      },
    ],
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    style: 'normal',
  },
  {
    _type: 'block',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'baz',
      },
    ],
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    style: 'normal',
  },
]

export const initialValuesTest = {
  name: 'initialValuesTest',
  type: 'document',
  title: 'Initial values test',
  icon: ArrowRightIcon,
  initialValue: {superlatives: {norwegian: 'Kjempebra'}},
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'String (initially set to "initial title")',
      initialValue: 'initial title',
    },
    {
      name: 'superlatives',
      title: 'Superlatives',
      type: 'superlatives',
      initialValue: {
        // see definition of the superlatives type for initial values defined for other fields
        english: 'Awesome',
      },
    },
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
      name: 'portableText',
      title: 'Portable text',
      type: 'array',
      of: [
        {
          type: 'block',
          of: [
            {
              type: 'object',
              name: 'person',
              title: 'Inline object with initial value',
              fields: [
                {name: 'firstName', type: 'string'},
                {name: 'lastName', type: 'string'},
              ],
              initialValue: {firstName: 'Ada', lastName: 'Lovelace'},
            },
            {
              type: 'object',
              name: 'species',
              title: 'Inline object with slow initial',
              fields: [
                {name: 'genus', type: 'string'},
                {name: 'family', type: 'string'},
                {name: 'commonName', type: 'string'},
              ],
              initialValue: () =>
                sleep(2000).then(() => ({
                  genus: 'Bradypus',
                  family: 'Bradypodidae',
                  commonName: 'Maned sloth',
                })),
            },
            {
              type: 'object',
              name: 'errorTest',
              title: 'Inline object with initial value resolution error',
              fields: [{name: 'something', type: 'string'}],
              initialValue: () =>
                sleep(2000).then(() => Promise.reject(new Error('This took a wrong turn'))),
            },
          ],
          marks: {
            annotations: [
              {
                type: 'object',
                name: 'link',
                fields: [{type: 'string', name: 'url', initialValue: 'https://sanity.io'}],
              },
              {
                type: 'object',
                name: 'test',
                title: 'Test annotation with initial value',
                fields: [{type: 'string', name: 'mystring'}],
                initialValue: {mystring: 'initial!'},
              },
            ],
          },
        },
        {
          type: 'object',
          name: 'testObject',
          title: 'Test object with initial value',
          fields: [{name: 'first', type: 'string'}],
          initialValue: {first: 'hello'},
        },
      ],
      initialValue: INITIAL_PORTABLE_TEXT_VALUE,
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
          description: 'the initial title value here takes a bit of time to load',
          fields: [
            {
              name: 'title',
              type: 'string',
              initialValue: () => sleep(2000).then(() => 'Slow title'),
            },
          ],
        },
        {
          type: 'object',
          name: 'errorProneInitialValue',
          description: 'the initial value here seems to fail',
          fields: [
            {
              name: 'title',
              type: 'string',
              initialValue: () =>
                sleep(1000).then(() => Promise.reject(new Error('Ouch, something went wrong'))),
            },
          ],
        },
      ],
      initialValue: [
        {_type: 'simpleObject', title: 'initial 1', primitiveValues: {title: 'inner title'}},
        {_type: 'simpleObject', title: 'initial 2', primitiveValues: {title: 'inner title'}},
      ],
    },
    {name: 'recursive', type: 'initialValuesTest'},
  ],
}
