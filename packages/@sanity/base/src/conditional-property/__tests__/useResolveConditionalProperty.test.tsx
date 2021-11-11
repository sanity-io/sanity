// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {renderHook} from '@testing-library/react-hooks'
import {unstable_useConditionalProperty as useConditionalProperty} from '..'

/* 
  @TODO
    - Add test for using parent argument
    - Add test for using current user role
*/

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'conditionalFieldsTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  title: 'Hello world',
  isPublished: true,
}

const DEFAULT_PROPS = {
  checkPropertyKey: 'testKey',
  document: dummyDocument,
  value: undefined,
  parent: {
    parentTest: 'hello',
  },
}

const callbackFn = jest.fn(() => true)

describe('Conditional property resolver', () => {
  it('calls callback function', () => {
    renderHook(() =>
      useConditionalProperty({
        checkProperty: callbackFn,
        ...DEFAULT_PROPS,
      })
    )
    expect(callbackFn).toBeCalled()
    expect(callbackFn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "currentUser": null,
            "document": Object {
              "_createdAt": "2021-11-04T15:41:48Z",
              "_id": "drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a",
              "_rev": "5hb8s6-k75-ip4-4bq-5ztbf3fbx",
              "_type": "conditionalFieldsTest",
              "_updatedAt": "2021-11-05T12:34:29Z",
              "isPublished": true,
              "title": "Hello world",
            },
            "parent": undefined,
            "value": undefined,
          },
        ],
      ]
    `)
  })

  it('resolves callback to true', () => {
    const {result} = renderHook(() =>
      useConditionalProperty({
        // eslint-disable-next-line max-nested-callbacks
        checkProperty: jest.fn(() => true),
        ...DEFAULT_PROPS,
      })
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false with callback that returns false', () => {
    const {result} = renderHook(() =>
      useConditionalProperty({
        // eslint-disable-next-line max-nested-callbacks
        checkProperty: jest.fn(() => false),
        ...DEFAULT_PROPS,
      })
    )
    expect(result.current).toBe(false)
  })

  it('returns false if document title does not match', () => {
    const {result} = renderHook(() =>
      useConditionalProperty({
        // eslint-disable-next-line max-nested-callbacks
        checkProperty: jest.fn(({document}) => document?.title !== 'Hello world'),
        ...DEFAULT_PROPS,
      })
    )
    expect(result.current).toBeFalsy()
  })

  it('returns true if document is published', () => {
    const {result} = renderHook(() =>
      useConditionalProperty({
        // eslint-disable-next-line max-nested-callbacks
        checkProperty: jest.fn(({document}) => Boolean(document?.isPublished)),
        ...DEFAULT_PROPS,
      })
    )
    expect(result.current).toBeTruthy()
  })

  it('returns undefined because callback returns undefined', () => {
    const {result} = renderHook(() =>
      useConditionalProperty({
        // eslint-disable-next-line max-nested-callbacks
        checkProperty: jest.fn(() => undefined),
        ...DEFAULT_PROPS,
      })
    )
    expect(result.current).toBe(undefined)
  })

  it('returns true because value matches', () => {
    const {result} = renderHook(() =>
      useConditionalProperty({
        // eslint-disable-next-line max-nested-callbacks
        checkProperty: jest.fn(({value}) => value === 'test value'),
        ...DEFAULT_PROPS,
        value: 'test value',
      })
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false because value does not match', () => {
    const {result} = renderHook(() =>
      useConditionalProperty({
        // eslint-disable-next-line max-nested-callbacks
        checkProperty: jest.fn(({value}) => value === 'test'),
        ...DEFAULT_PROPS,
        value: 'test value',
      })
    )
    expect(result.current).toBeFalsy()
  })
})
