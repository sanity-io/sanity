import {defineField, type FieldDefinition} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {RELEASE_METADATA_TYPE_NAME} from '../compileReleaseMetadataType'
import {useReleaseMetadataSchemaType} from '../useReleaseMetadataSchemaType'

const legalReview = defineField({name: 'legalReview', title: 'Legal review', type: 'string'})
const region = defineField({name: 'region', title: 'Region', type: 'string'})

async function renderSchemaTypeHook(
  fields: FieldDefinition[] | undefined,
  beta?: {variants: {enabled: boolean}},
) {
  const wrapper = await createTestProvider({
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      beta,
      releases: fields ? {metadata: {fields}} : undefined,
    },
  })
  return renderHook(() => useReleaseMetadataSchemaType(), {wrapper})
}

describe('useReleaseMetadataSchemaType', () => {
  it('compiles the configured fields into the metadata object type', async () => {
    const {result} = await renderSchemaTypeHook([legalReview, region])

    expect(result.current?.schemaType.name).toBe(RELEASE_METADATA_TYPE_NAME)
    expect(result.current?.schemaType.fields.map((field) => field.name)).toEqual([
      'legalReview',
      'region',
    ])
    expect(result.current?.schema.get(RELEASE_METADATA_TYPE_NAME)).toBe(result.current?.schemaType)
  })

  it('does not depend on beta.variants', async () => {
    const {result: disabled} = await renderSchemaTypeHook([legalReview], {
      variants: {enabled: false},
    })
    const {result: enabled} = await renderSchemaTypeHook([legalReview], {
      variants: {enabled: true},
    })

    expect(disabled.current?.schemaType.fields.map((field) => field.name)).toEqual(['legalReview'])
    expect(enabled.current?.schemaType.fields.map((field) => field.name)).toEqual(['legalReview'])
  })

  it('returns null when no fields are configured', async () => {
    const {result: missing} = await renderSchemaTypeHook(undefined)
    const {result: empty} = await renderSchemaTypeHook([])

    expect(missing.current).toBeNull()
    expect(empty.current).toBeNull()
  })

  it('returns null when every configured field is rejected', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const {result} = await renderSchemaTypeHook([
      defineField({name: 'gallery', type: 'array', of: [{type: 'string'}]}),
    ])

    expect(result.current).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "gallery"'))
    warn.mockRestore()
  })

  it('keeps the compiled result stable across re-renders', async () => {
    const {result, rerender} = await renderSchemaTypeHook([legalReview])
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
