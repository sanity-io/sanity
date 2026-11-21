import {defineField, type FieldDefinition} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useDefaultReleaseProperties} from '../useDefaultReleaseProperties'

const nestedOnly = defineField({
  name: 'nestedOnly',
  title: 'Nested only',
  type: 'object',
  fields: [
    defineField({
      name: 'inner',
      type: 'object',
      fields: [defineField({name: 'detail', type: 'string'})],
    }),
  ],
})

const signOff = defineField({
  name: 'signOff',
  title: 'Sign-off',
  type: 'object',
  fields: [
    defineField({name: 'reviewer', type: 'string'}),
    defineField({
      name: 'inner',
      type: 'object',
      fields: [defineField({name: 'detail', type: 'string'})],
    }),
  ],
})

const region = defineField({name: 'region', title: 'Region', type: 'string'})

async function renderDefaultPropertiesHook(fields: FieldDefinition[]) {
  const wrapper = await createTestProvider({
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      releases: {metadata: {fields}},
    },
  })
  return renderHook(() => useDefaultReleaseProperties(), {wrapper})
}

describe('useDefaultReleaseProperties', () => {
  it('gives no row to an object whose fields are all nested objects', async () => {
    const {result} = await renderDefaultPropertiesHook([nestedOnly, region])

    expect(result.current.properties.map((property) => property.field)).toEqual(['region'])
    expect([...result.current.fieldTitles.keys()]).toEqual(['region'])
  })

  it('keeps the row of an object that has a field besides its nested objects', async () => {
    const {result} = await renderDefaultPropertiesHook([signOff, nestedOnly, region])

    expect(result.current.properties.map((property) => property.field)).toEqual([
      'signOff',
      'region',
    ])
  })
})
