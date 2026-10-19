import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type FieldDefinition, type SanityDocument} from '@sanity/types'
import {firstValueFrom, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {validateDocument, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'

const builtinSchema = inferFromSchema(SchemaBuilder.compile({name: 'studio', types: builtinTypes}))

function createFixture(shape: 'object' | 'array') {
  const hidden = vi.fn(() => false)
  const reference = {type: 'reference', to: [{type: 'article'}], hidden}
  const children = Array.from({length: 50}, (_, index) => ({
    _type: 'reference',
    _key: `child-${index}`,
    _ref: `target-${index}`,
  }))
  const field: FieldDefinition =
    shape === 'object'
      ? {
          name: 'children',
          type: 'object',
          fields: children.map((_, index) => ({name: `child${index}`, ...reference})),
        }
      : {name: 'children', type: 'array', of: [reference]}
  const schema = inferFromSchema(
    SchemaBuilder.compile({
      name: 'test',
      parent: builtinSchema,
      types: [{name: 'article', type: 'document', fields: [field]}],
    }),
  )
  const document: SanityDocument = {
    _id: 'article',
    _type: 'article',
    _rev: 'rev',
    _createdAt: '',
    _updatedAt: '',
    children:
      shape === 'object'
        ? Object.fromEntries(children.map((child, index) => [`child${index}`, child]))
        : children,
  }
  return {document, schema, hidden}
}

describe.each(['object', 'array'] as const)('lazy %s child validation', (shape) => {
  it('defers queued children until active checks finish, then validates every child', async () => {
    const {document, schema, hidden} = createFixture(shape)
    const response = new Subject<boolean>()
    const responsePromise = firstValueFrom(response)
    const getDocumentExists = vi.fn(() => responsePromise)
    const validation = validateDocument({document, schema, getDocumentExists})

    await vi.waitFor(() => expect(getDocumentExists).toHaveBeenCalled())
    expect(hidden.mock.calls.length).toBeLessThan(50)

    response.next(false)
    response.complete()
    const result = await validation
    expect(hidden).toHaveBeenCalledTimes(50)
    expect(getDocumentExists).toHaveBeenCalledTimes(50)
    expect(result.status).toBe('failed')
    expect(result.markers).toHaveLength(50)
    expect(
      result.markers.every(({code}) => code === validationMarkerCodes.referenceNotPublished),
    ).toBe(true)
  })
})
