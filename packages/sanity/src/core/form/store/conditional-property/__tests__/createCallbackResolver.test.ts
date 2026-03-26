import {Schema} from '@sanity/schema'
import {type ConditionalProperty, type ObjectSchemaType} from '@sanity/types'
import {expect, test, vi} from 'vitest'

import {createCallbackResolver} from '../createCallbackResolver'

function getBookType(properties: {
  subtitle?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
}) {
  return Schema.compile({
    name: 'test',
    types: [
      {
        name: 'book',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'subtitle', type: 'string', ...properties.subtitle},
        ],
      },
    ],
  }).get('book')
}

test('it notifies subscribers when async hidden resolves', async () => {
  let resolveHidden!: (value: boolean) => void
  const hiddenPromise = new Promise<boolean>((resolve) => {
    resolveHidden = resolve
  })
  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {hidden: (() => hiddenPromise) as any},
  })
  const prepareHiddenState = createCallbackResolver({property: 'hidden'})
  const listener = vi.fn()
  const documentValue = {_id: 'one', _type: 'book'}

  prepareHiddenState.subscribe(listener)

  const initialState = prepareHiddenState({
    currentUser: null,
    documentValue,
    schemaType,
  })

  expect(initialState?.children?.subtitle?.value).toBe(true)

  resolveHidden(false)
  await hiddenPromise
  await Promise.resolve()
  await Promise.resolve()

  expect(listener).toHaveBeenCalledTimes(1)

  const resolvedState = prepareHiddenState({
    currentUser: null,
    documentValue,
    schemaType,
  })

  expect(resolvedState?.children?.subtitle).toBeUndefined()
})

test('it ignores stale async results for previous documents', async () => {
  let resolveFirst!: (value: boolean) => void
  const firstPromise = new Promise<boolean>((resolve) => {
    resolveFirst = resolve
  })
  const secondPromise = new Promise<boolean>(() => {})
  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {
      hidden: (({document}) => (document?._id === 'one' ? firstPromise : secondPromise)) as any,
    },
  })
  const prepareHiddenState = createCallbackResolver({property: 'hidden'})
  const listener = vi.fn()

  prepareHiddenState.subscribe(listener)

  prepareHiddenState({
    currentUser: null,
    documentValue: {_id: 'one', _type: 'book'},
    schemaType,
  })

  const secondState = prepareHiddenState({
    currentUser: null,
    documentValue: {_id: 'two', _type: 'book'},
    schemaType,
  })

  expect(secondState?.children?.subtitle?.value).toBe(true)

  resolveFirst(false)
  await firstPromise
  await Promise.resolve()
  await Promise.resolve()

  const currentState = prepareHiddenState({
    currentUser: null,
    documentValue: {_id: 'two', _type: 'book'},
    schemaType,
  })

  expect(listener).not.toHaveBeenCalled()
  expect(currentState?.children?.subtitle?.value).toBe(true)
})
