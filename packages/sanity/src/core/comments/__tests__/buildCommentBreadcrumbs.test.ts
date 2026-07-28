import {Schema} from '@sanity/schema'
import {type CurrentUser, defineField} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {buildCommentBreadcrumbs} from '../utils/buildCommentBreadcrumbs'

const CURRENT_USER: CurrentUser = {
  email: '',
  id: '',
  name: '',
  role: '',
  roles: [],
  profileImage: '',
  provider: '',
}

const stringWithTitleField = defineField({
  name: 'stringWithTitle',
  title: 'My string title',
  type: 'string',
})

const stringWithoutTitleField = defineField({name: 'stringWithoutTitle', type: 'string'})

const stringWithHiddenCallback = defineField({
  name: 'stringWithHiddenCallback',
  type: 'string',
  hidden: () => true,
})

const objectField = defineField({
  name: 'myObject',
  title: 'My object title',
  type: 'object',
  fields: [stringWithTitleField, stringWithHiddenCallback],
})

const arrayOfObjectsField = defineField({
  name: 'myArray',
  title: 'My array title',
  type: 'array',
  of: [objectField],
})

const nestedArrayOfObjectsField = defineField({
  name: 'myNestedArray',
  title: 'My nested array title',
  type: 'array',
  of: [
    {
      type: 'object',
      name: 'myNestedObject',
      fields: [arrayOfObjectsField],
    },
  ],
})

const arrayWithAnonymousObjectField = defineField({
  name: 'myArrayWithAnonymousObject',
  title: 'My array with anonymous object title',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        {
          name: 'anonymousString',
          type: 'string',
          title: 'Anonymous string title',
        },
      ],
    },
  ],
})

const arrayWithAnonymousObjectFieldWithHiddenCallback = defineField({
  name: 'myArrayWithAnonymousObjectFieldWithHiddenCallback',
  title: 'My array with anonymous object field with hidden callback title',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        {
          name: 'anonymousStringWithHiddenCallback',
          type: 'string',
          title: 'Anonymous string with hidden callback title',
          hidden: () => true,
        },
      ],
    },
  ],
})

const arrayWithNestedObjectField = defineField({
  name: 'myArrayWithNestedObject',
  title: 'My array with nested object title',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        {
          name: 'nestedObject',
          type: 'object',
          fields: [
            {
              name: 'nestedObjectTitle',
              type: 'string',
              title: 'Nested object title',
            },
            {
              name: 'nestedObjectDescription',
              type: 'string',
              title: 'Nested object description',
            },
            {
              name: 'nestedObjectHiddenCallback',
              type: 'string',
              title: 'Nested object hidden callback',
              hidden: () => true,
            },
            {
              type: 'array',
              name: 'nestedObjectArray',
              title: 'Nested object array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'nestedObjectArrayTitle',
                      type: 'string',
                      title: 'Nested object array title',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'testDocument',
      title: 'Document',
      type: 'document',
      fields: [
        stringWithTitleField,
        stringWithoutTitleField,
        objectField,
        stringWithHiddenCallback,
        arrayOfObjectsField,
        nestedArrayOfObjectsField,
        arrayWithAnonymousObjectField,
        arrayWithAnonymousObjectFieldWithHiddenCallback,
        arrayWithNestedObjectField,
      ],
    },
  ],
})

describe('comments: buildCommentBreadcrumbs', () => {
  test('should use the title in the schema field if it exists', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {},
      fieldPath: 'stringWithTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([{invalid: false, isArrayItem: false, title: 'My string title'}])
  })

  test('should use the field name as title if no title exists', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {},
      fieldPath: 'stringWithoutTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([{invalid: false, isArrayItem: false, title: 'String Without Title'}])
  })

  test('should build breadcrumbs for object with nested fields', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {},
      fieldPath: 'myObject.stringWithTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My object title'},
      {invalid: false, isArrayItem: false, title: 'My string title'},
    ])
  })

  test('should invalidate the breadcrumb if the field is hidden', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {},
      fieldPath: 'stringWithHiddenCallback',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: true, isArrayItem: false, title: 'String With Hidden Callback'},
    ])
  })

  test('should build breadcrumbs for array of objects', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArray: [
          {
            _key: 'key1',
            _type: 'myObject',
            stringWithTitle: 'Hello world',
          },
          {
            _key: 'key2',
            _type: 'myObject',
            stringWithTitle: 'Hello world',
          },
        ],
      },
      fieldPath: 'myArray[_key=="key2"].stringWithTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My array title'},
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: false, isArrayItem: false, title: 'My string title'},
    ])
  })

  test('should invalidate the breadcrumb if the array item is not found', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArray: [
          {
            _key: 'key1',
            _type: 'myObject',
            stringWithTitle: 'Hello world',
          },
          {
            _key: 'key2',
            _type: 'myObject',
            stringWithTitle: 'Hello world',
          },
        ],
      },
      fieldPath: 'myArray[_key=="key3"].stringWithTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My array title'},
      {invalid: true, isArrayItem: true, title: 'Unknown array item'},
      {invalid: true, isArrayItem: false, title: 'Unknown field'},
    ])
  })

  test('should build breadcrumbs for nested array of objects', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myNestedArray: [
          {
            _key: 'key1',
            _type: 'myNestedObject',
            myArray: [
              {
                _key: 'key2',
                _type: 'myObject',
                stringWithTitle: 'Hello world',
              },
              {
                _key: 'key3',
                _type: 'myObject',
                stringWithTitle: 'Hello world',
              },
              {
                _key: 'key4',
                _type: 'myObject',
                stringWithTitle: 'Hello world',
              },
            ],
          },
        ],
      },
      fieldPath: 'myNestedArray[_key=="key1"].myArray[_key=="key3"].stringWithTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My nested array title'},
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'My array title'},
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: false, isArrayItem: false, title: 'My string title'},
    ])
  })

  test('should invalidate the breadcrumb if a nested array item is hidden', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myNestedArray: [
          {
            _key: 'key1',
            _type: 'myNestedObject',
            myArray: [
              {
                _key: 'key2',
                _type: 'myObject',
                stringWithTitle: 'Hello world',
              },
              {
                _key: 'key3',
                _type: 'myObject',
                stringWithHiddenCallback: 'Hello world',
              },
              {
                _key: 'key4',
                _type: 'myObject',
                stringWithTitle: 'Hello world',
              },
            ],
          },
        ],
      },
      fieldPath: 'myNestedArray[_key=="key1"].myArray[_key=="key3"].stringWithHiddenCallback',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My nested array title'},
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'My array title'},
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: true, isArrayItem: false, title: 'String With Hidden Callback'},
    ])
  })

  test('should build breadcrumbs for array of anonymous objects', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArrayWithAnonymousObject: [
          {
            _key: 'key1',
            anonymousString: 'Hello world',
          },
          {
            _key: 'key2',
            anonymousString: 'Hello world',
          },
        ],
      },
      fieldPath: 'myArrayWithAnonymousObject[_key=="key2"].anonymousString',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My array with anonymous object title'},
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: false, isArrayItem: false, title: 'Anonymous string title'},
    ])
  })

  test('should invalidate the breadcrumb if the array item is not found in an array of anonymous objects', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArrayWithAnonymousObject: [
          {
            _key: 'key1',
            anonymousString: 'Hello world',
          },
          {
            _key: 'key2',
            anonymousString: 'Hello world',
          },
        ],
      },
      fieldPath: 'myArrayWithAnonymousObject[_key=="key3"].anonymousString',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My array with anonymous object title'},
      {invalid: true, isArrayItem: true, title: 'Unknown array item'},
      {invalid: true, isArrayItem: false, title: 'Unknown field'},
    ])
  })

  test('should invalidate the breadcrumb if the array item is hidden in an array of anonymous objects', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArrayWithAnonymousObjectFieldWithHiddenCallback: [
          {
            _key: 'key1',
            anonymousStringWithHiddenCallback: 'Hello world',
          },
          {
            _key: 'key2',
            anonymousStringWithHiddenCallback: 'Hello world',
          },
        ],
      },
      fieldPath:
        'myArrayWithAnonymousObjectFieldWithHiddenCallback[_key=="key2"].anonymousStringWithHiddenCallback',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {
        invalid: false,
        isArrayItem: false,
        title: 'My array with anonymous object field with hidden callback title',
      },
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: true, isArrayItem: false, title: 'Anonymous string with hidden callback title'},
    ])
  })
  test('should resolve the crumb if the field is part of an array with a nested object', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArrayWithNestedObject: [
          {
            _key: 'key1',
            nestedObject: {
              nestedObjectTitle: 'Hello world',
            },
          },
        ],
      },
      fieldPath: 'myArrayWithNestedObject[_key=="key1"].nestedObject.nestedObjectTitle',
      schemaType: schema.get('testDocument'),
    })
    expect(crumbs).toEqual([
      {
        invalid: false,
        isArrayItem: false,
        title: 'My array with nested object title',
      },
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'Nested Object'},
      {invalid: false, isArrayItem: false, title: 'Nested object title'},
    ])
  })
  test('should invalidate the crumb if the field is part of an array with a nested object in a hidden field', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArrayWithNestedObject: [
          {
            _key: 'key1',
            nestedObject: {
              nestedObjectTitle: 'Hello world',
            },
          },
        ],
      },
      fieldPath: 'myArrayWithNestedObject[_key=="key1"].nestedObject.nestedObjectHiddenCallback',
      schemaType: schema.get('testDocument'),
    })
    expect(crumbs).toEqual([
      {
        invalid: false,
        isArrayItem: false,
        title: 'My array with nested object title',
      },
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'Nested Object'},
      {invalid: true, isArrayItem: false, title: 'Nested object hidden callback'},
    ])
  })
  test('should resolve the crumb if the field is part of an array with a nested object in a nested array', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {
        myArrayWithNestedObject: [
          {
            _key: 'key1',
            nestedObject: {
              nestedObjectArray: [{_key: 'key2', nestedObjectArrayTitle: 'Hello world'}],
            },
          },
        ],
      },
      fieldPath:
        'myArrayWithNestedObject[_key=="key1"].nestedObject.nestedObjectArray[_key=="key2"].nestedObjectArrayTitle',
      schemaType: schema.get('testDocument'),
    })
    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My array with nested object title'},
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'Nested Object'},
      {invalid: false, isArrayItem: false, title: 'Nested object array'},
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'Nested object array title'},
    ])
  })
})
