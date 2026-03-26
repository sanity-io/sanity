import {Schema} from '@sanity/schema'
import {type ConditionalProperty, type ObjectSchemaType} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {expect, test, vi} from 'vitest'

import {useFormState} from '../useFormState'

vi.mock('../../../store', () => ({
  useCurrentUser: () => null,
}))

function getBookType(properties: {subtitle?: {hidden?: ConditionalProperty}}) {
  return Schema.compile({
    name: 'test',
    types: [
      {
        name: 'book',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'showSubtitle', type: 'boolean'},
          {name: 'subtitle', type: 'string', ...properties.subtitle},
        ],
      },
    ],
  }).get('book')
}

test('it recomputes hidden when document contents change without a new object reference', async () => {
  const documentValue = {_id: 'foo', _type: 'book', showSubtitle: false}
  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {hidden: ({document}) => !document?.showSubtitle},
  })

  const {result, rerender} = renderHook(
    ({value}) =>
      useFormState({
        comparisonValue: value,
        documentValue: value,
        focusPath: [],
        hasUpstreamVersion: false,
        openPath: [],
        perspective: 'published',
        presence: [],
        schemaType,
        validation: [],
      }),
    {
      initialProps: {value: documentValue},
    },
  )

  expect(result.current).not.toBe(null)
  if (result.current === null) {
    throw new Error('should not be hidden')
  }

  expect(
    result.current.members.map((member) => member.kind === 'field' && member.name),
  ).not.toContain('subtitle')

  documentValue.showSubtitle = true
  rerender({value: documentValue})

  expect(result.current).not.toBe(null)
  if (result.current === null) {
    throw new Error('should not be hidden')
  }

  expect(result.current.members.map((member) => member.kind === 'field' && member.name)).toContain(
    'subtitle',
  )
})
