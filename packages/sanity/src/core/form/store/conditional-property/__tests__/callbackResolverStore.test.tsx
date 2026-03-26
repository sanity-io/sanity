import {Schema} from '@sanity/schema'
import {type ConditionalProperty, type ObjectSchemaType} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {useMemo, useSyncExternalStore} from 'react'
import {expect, test} from 'vitest'

import {createCallbackResolver} from '../createCallbackResolver'

function getBookType(properties: {subtitle?: {hidden?: ConditionalProperty}}) {
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

test('useSyncExternalStore rerenders when callback resolver resolves async hidden', async () => {
  let resolveHidden!: (value: boolean) => void
  const hiddenPromise = new Promise<boolean>((resolve) => {
    resolveHidden = resolve
  })
  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {hidden: (() => hiddenPromise) as any},
  })
  const documentValue = {_id: 'foo', _type: 'book'}

  const {result} = renderHook(() => {
    const resolver = useMemo(() => createCallbackResolver({property: 'hidden'}), [])
    const version = useSyncExternalStore(
      resolver.subscribe,
      resolver.getVersion,
      resolver.getVersion,
    )
    const hidden = resolver({
      currentUser: null,
      documentValue,
      schemaType,
    })

    return {hidden, version}
  })

  expect(result.current.hidden?.children?.subtitle?.value).toBe(true)
  expect(result.current.version).toBe(0)

  resolveHidden(false)
  await hiddenPromise

  await waitFor(() => {
    expect(result.current.version).toBeGreaterThan(0)
    expect(result.current.hidden?.children?.subtitle).toBeUndefined()
  })
})

test('it does not get stuck hidden when document snapshots are recreated between renders', async () => {
  let resolveHidden!: (value: boolean) => void
  const hiddenPromise = new Promise<boolean>((resolve) => {
    resolveHidden = resolve
  })
  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {hidden: (() => hiddenPromise) as any},
  })

  const {result} = renderHook(() => {
    const resolver = useMemo(() => createCallbackResolver({property: 'hidden'}), [])
    const version = useSyncExternalStore(
      resolver.subscribe,
      resolver.getVersion,
      resolver.getVersion,
    )
    const hidden = resolver({
      currentUser: null,
      documentValue: {_id: 'foo', _type: 'book'},
      schemaType,
    })

    return {hidden, version}
  })

  expect(result.current.hidden?.children?.subtitle?.value).toBe(true)

  resolveHidden(false)
  await hiddenPromise

  await waitFor(() => {
    expect(result.current.version).toBeGreaterThan(0)
    expect(result.current.hidden?.children?.subtitle).toBeUndefined()
  })
})
