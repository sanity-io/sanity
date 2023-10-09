import {Schema} from '@sanity/schema'
import {CurrentUser, defineField} from '@sanity/types'
import {buildCommentBreadcrumbs} from '../utils'

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
  title: 'String title',
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
  title: 'My object',
  type: 'object',
  fields: [stringWithTitleField, stringWithHiddenCallback],
})

const arrayOfObjectsField = defineField({
  name: 'myArray',
  title: 'My array',
  type: 'array',
  of: [objectField],
})

const nestedArrayOfObjectsField = defineField({
  name: 'myNestedArray',
  title: 'My nested array',
  type: 'array',
  of: [
    {
      type: 'object',
      name: 'myNestedObject',
      fields: [arrayOfObjectsField],
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
      ],
    },
  ],
})

describe('comments: buildCommentBreadcrumbs', () => {
  it('should use the title in the schema field if it exists', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {},
      fieldPath: 'stringWithTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([{invalid: false, isArrayItem: false, title: 'String title'}])
  })

  it('should use the field name as title if no title exists', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {},
      fieldPath: 'stringWithoutTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([{invalid: false, isArrayItem: false, title: 'String Without Title'}])
  })

  it('should build breadcrumbs for object with nested fields', () => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser: CURRENT_USER,
      documentValue: {},
      fieldPath: 'myObject.stringWithTitle',
      schemaType: schema.get('testDocument'),
    })

    expect(crumbs).toEqual([
      {invalid: false, isArrayItem: false, title: 'My object'},
      {invalid: false, isArrayItem: false, title: 'String title'},
    ])
  })

  it('should invalidate the breadcrumb if the field is hidden', () => {
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

  it('should build breadcrumbs for array of objects', () => {
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
      {invalid: false, isArrayItem: false, title: 'My array'},
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: false, isArrayItem: false, title: 'String title'},
    ])
  })

  it('should invalidate the breadcrumb if the array item is not found', () => {
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
      {invalid: false, isArrayItem: false, title: 'My array'},
      {invalid: true, isArrayItem: true, title: 'Unknown array item'},
      {invalid: true, isArrayItem: false, title: 'Unknown field'},
    ])
  })

  it('should build breadcrumbs for nested array of objects', () => {
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
      {invalid: false, isArrayItem: false, title: 'My nested array'},
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'My array'},
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: false, isArrayItem: false, title: 'String title'},
    ])
  })

  it('should invalidate the breadcrumb if a nested array item is hidden', () => {
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
      {invalid: false, isArrayItem: false, title: 'My nested array'},
      {invalid: false, isArrayItem: true, title: '#1'},
      {invalid: false, isArrayItem: false, title: 'My array'},
      {invalid: false, isArrayItem: true, title: '#2'},
      {invalid: true, isArrayItem: false, title: 'String With Hidden Callback'},
    ])
  })
})
