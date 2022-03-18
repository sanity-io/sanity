import {renderHook} from '@testing-library/react-hooks'
import React from 'react'
import {createMockSanityClient} from '../../test/mocks/mockSanityClient'
import {createConfig} from '../config'
import {SanityProvider} from '../sanity'
import {SanitySource, useSource} from '../source'
import {
  ConditionalPropertyProps,
  unstable_useConditionalProperty as useConditionalProperty,
} from './useConditionalProperty'

const useSourceMock = useSource as jest.Mock<SanitySource>

jest.mock('../client/useClient')

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'conditionalFieldsTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  title: 'Hello world',
  isPublished: true,
}

const DEFAULT_PROPS: Omit<ConditionalPropertyProps, 'checkProperty'> = {
  checkPropertyKey: 'testKey',
  document: dummyDocument,
  value: undefined,
  parent: {
    parentTest: 'hello',
  },
}

const config = createConfig({
  sources: [
    {
      name: 'test',
      title: 'Test',
      projectId: 'foo',
      dataset: 'test',
      schemaTypes: [],
    },
  ],
})

const wrapper = ({children}: any) => <SanityProvider config={config}>{children}</SanityProvider>

afterEach(() => {
  jest.resetAllMocks()
})

describe('Conditional property resolver', () => {
  it('calls callback function', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const callbackFn = jest.fn(() => true)

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: callbackFn,
          ...DEFAULT_PROPS,
        }),
      {wrapper}
    )

    if (result.error) {
      throw result.error
    }

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
      "parent": Object {
        "parentTest": "hello",
      },
      "value": undefined,
    },
  ],
]
`)
  })

  it('resolves callback to true', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(() => true),
          ...DEFAULT_PROPS,
        }),
      {wrapper}
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false with callback that returns false', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(() => false),
          ...DEFAULT_PROPS,
        }),
      {wrapper}
    )
    expect(result.current).toBe(false)
  })

  it('returns false if document title does not match', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({document}) => document?.title !== 'Hello world'),
          ...DEFAULT_PROPS,
        }),
      {wrapper}
    )
    expect(result.current).toBeFalsy()
  })

  it('returns true if document is published', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({document}) => Boolean(document?.isPublished)),
          ...DEFAULT_PROPS,
        }),
      {wrapper}
    )
    expect(result.current).toBeTruthy()
  })

  it('returns undefined because callback returns undefined', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(() => undefined) as any,
          ...DEFAULT_PROPS,
        }),
      {wrapper}
    )
    expect(result.current).toBe(undefined)
  })

  it('returns true because value matches', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({value}) => value === 'test value'),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper}
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false because value does not match', () => {
    const mockClient = createMockSanityClient()

    useSourceMock.mockImplementation(() => ({client: mockClient} as any))

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({value}) => value === 'test'),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper}
    )
    expect(result.current).toBeFalsy()
  })

  it.todo('returns true when current user role is not administrator')
  it.todo('returns true when sibling field is not empty')
})
