import {Schema} from '@sanity/schema'
import {type ConditionalProperty, type ObjectSchemaType} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {expect, test, vi} from 'vitest'

import {useFormState} from '../useFormState'

vi.mock('../../../store', () => ({
  useCurrentUser: () => null,
}))

const mockGetClient = vi.fn()

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

test('it rerenders when async hidden resolves to false', async () => {
  let resolveHidden!: (value: boolean) => void
  const hiddenPromise = new Promise<boolean>((resolve) => {
    resolveHidden = resolve
  })
  const hiddenCallback = vi.fn(() => hiddenPromise)

  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {hidden: hiddenCallback as any},
  })
  const documentValue = {_id: 'foo', _type: 'book'}
  let renderCount = 0

  const {result} = renderHook(() => {
    renderCount += 1

    return useFormState({
      comparisonValue: documentValue,
      documentValue,
      focusPath: [],
      hasUpstreamVersion: false,
      openPath: [],
      perspective: 'published',
      presence: [],
      schemaType,
      validation: [],
    })
  })

  expect(result.current).not.toBe(null)
  if (result.current === null) {
    throw new Error('should not be hidden')
  }

  expect(hiddenCallback).toHaveBeenCalled()
  expect(
    result.current.members.map((member) => member.kind === 'field' && member.name),
  ).not.toContain('subtitle')

  await Promise.resolve()
  resolveHidden(false)
  await hiddenPromise

  await waitFor(
    () => {
      expect(renderCount).toBeGreaterThan(1)
      expect(result.current).not.toBe(null)
      if (result.current === null) {
        throw new Error('should not be hidden')
      }

      expect(
        result.current.members.map((member) => member.kind === 'field' && member.name),
      ).toContain('subtitle')
    },
    {timeout: 500},
  )
})

test('it passes getClient through hidden callbacks', () => {
  const hiddenCallback = vi.fn(({getClient}) => getClient !== mockGetClient)
  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {hidden: hiddenCallback as any},
  })
  const documentValue = {_id: 'foo', _type: 'book'}

  const {result} = renderHook(() =>
    useFormState({
      comparisonValue: documentValue,
      documentValue,
      focusPath: [],
      getClient: mockGetClient,
      hasUpstreamVersion: false,
      openPath: [],
      perspective: 'published',
      presence: [],
      schemaType,
      validation: [],
    }),
  )

  expect(result.current).not.toBe(null)
  if (result.current === null) {
    throw new Error('should not be hidden')
  }

  expect(hiddenCallback).toHaveBeenCalledWith(expect.objectContaining({getClient: mockGetClient}))
  expect(result.current.members.map((member) => member.kind === 'field' && member.name)).toContain(
    'subtitle',
  )
})
