import {type ConditionalPropertyCallback} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {
  type ConditionalPropertyProps,
  unstable_useConditionalProperty as useConditionalProperty,
} from './useConditionalProperty'

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'conditionalFieldsTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  title: 'Hello world',
  isPublished: true,
  venue: {
    location: {lat: 37.813563, lng: -122.268812},
    address: {
      street: '2421 Telegraph Ave #102',
      city: 'Oakland',
      zip: 94612,
      state: 'California',
    },
  },
}

const DEFAULT_PROPS: Omit<ConditionalPropertyProps, 'checkProperty'> = {
  checkPropertyKey: 'testKey',
  document: dummyDocument,
  value: undefined,
  parent: {
    parentTest: 'hello',
    siblingProp: true,
  },
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('Conditional property resolver', () => {
  /* eslint-disable max-nested-callbacks */
  it('calls callback function', async () => {
    const TestWrapper = await createTestProvider()
    const callbackFn = vi.fn(() => true)

    renderHook(
      () =>
        useConditionalProperty({
          checkProperty: callbackFn,
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper},
    )

    expect(callbackFn).toBeCalled()

    expect(callbackFn.mock.calls).toMatchSnapshot()
  })

  it('resolves callback to true', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn(() => true),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false with callback that returns false', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn(() => false),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBe(false)
  })

  it('returns false if document title does not match', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn<ConditionalPropertyCallback>(
            ({document}) => document?.title !== 'Hello world',
          ),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeFalsy()
  })

  it('returns true if document is published', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn<ConditionalPropertyCallback>(({document}) =>
            Boolean(document?.isPublished),
          ),
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeTruthy()
  })

  it('returns undefined because callback returns undefined', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn(() => undefined) as any,
          ...DEFAULT_PROPS,
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBe(undefined)
    expect(consoleSpy).toHaveBeenCalledWith(
      'The `testKey` option is or returned `undefined`. `testKey` should return a boolean.',
    )
  })

  it('returns true because value matches', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn<ConditionalPropertyCallback>(({value}) => value === 'test value'),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeTruthy()
  })

  it('returns false because value does not match', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn<ConditionalPropertyCallback>(({value}) => value === 'test'),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeFalsy()
  })

  it('returns true when the current user does not have role "developer"', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn<ConditionalPropertyCallback>(
            ({currentUser}) => !currentUser?.roles.some((role) => role.name === 'developer'),
          ),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeTruthy()
  })

  it('returns true when the current user has role "administrator"', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkProperty: vi.fn<ConditionalPropertyCallback>(({currentUser}) =>
            Boolean(currentUser?.roles.some((role) => role.name === 'administrator')),
          ),
          ...DEFAULT_PROPS,
          value: 'test value',
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeTruthy()
  })

  it('returns true when sibling field is not empty', async () => {
    const TestWrapper = await createTestProvider()
    const {result} = renderHook(
      () =>
        useConditionalProperty({
          checkPropertyKey: 'hidden',
          document: dummyDocument,
          value: dummyDocument.venue.address,
          parent: dummyDocument.venue,
          checkProperty: vi.fn<ConditionalPropertyCallback>(({parent}) => Boolean(parent.location)),
        }),
      {wrapper: TestWrapper},
    )
    expect(result.current).toBeTruthy()
  })
  /* eslint-enable max-nested-callbacks */
})
