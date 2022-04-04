import {renderHook} from '@testing-library/react-hooks'
import React, {useMemo} from 'react'
// import {createMockSanityClient} from '../../test/mocks/mockSanityClient'
import {createConfig} from '../config'
import {StudioProvider} from '../studio'
import {
  ConditionalPropertyProps,
  unstable_useConditionalProperty as useConditionalProperty,
} from './useConditionalProperty'

// This mock is needed to prevent the "not wrapped in act()" error from React testing library.
// The reason is that the `useCurrentUser` is used by `ObjectInput` to figure out which fields are
// hidden, and using this hook causes the `ObjectInput` to render again once the user is loaded.
//
// NOTE!
// We can remove this mock when `ObjectInput` no longer uses `useCurrentUser`.
jest.mock('../datastores/user/hooks', () => {
  const hooks = jest.requireActual('../datastores/user/hooks')

  return {
    ...hooks,
    useCurrentUser: jest.fn().mockImplementation(() => ({
      value: {},
      error: null,
      isLoading: false,
    })),
  }
})

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

function TestWrapper({children}: any) {
  const config = useMemo(
    () =>
      createConfig({
        // clientFactory: () => createMockSanityClient() as any,
        name: 'test',
        title: 'Test',
        projectId: 'foo',
        dataset: 'test',
      }),
    []
  )

  return <StudioProvider config={config}>{children}</StudioProvider>
}

afterEach(() => {
  jest.resetAllMocks()
})

describe('Conditional property resolver', () => {
  it('calls callback function', () => {
    const callbackFn = jest.fn(() => true)

    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: callbackFn,
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper}
    )

    if (result.error) {
      throw result.error
    }

    expect(callbackFn).toBeCalled()

    expect(callbackFn.mock.calls).toMatchSnapshot()
  })

  it('resolves callback to true', () => {
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(() => true),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper}
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false with callback that returns false', () => {
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(() => false),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper}
    )
    expect(result.current).toBe(false)
  })

  it('returns false if document title does not match', () => {
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({document}) => document?.title !== 'Hello world'),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper}
    )
    expect(result.current).toBeFalsy()
  })

  it('returns true if document is published', () => {
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({document}) => Boolean(document?.isPublished)),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper}
    )
    expect(result.current).toBeTruthy()
  })

  it('returns undefined because callback returns undefined', () => {
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(() => undefined) as any,
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper}
    )
    expect(result.current).toBe(undefined)
  })

  it('returns true because value matches', () => {
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({value}) => value === 'test value'),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper: TestWrapper}
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false because value does not match', () => {
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          // eslint-disable-next-line max-nested-callbacks
          checkProperty: jest.fn(({value}) => value === 'test'),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper: TestWrapper}
    )
    expect(result.current).toBeFalsy()
  })

  it.todo('returns true when current user role is not administrator')
  it.todo('returns true when sibling field is not empty')
})
