import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  buildFieldFacets,
  type FacetCandidateField,
  type FacetValuesById,
  getFacetCandidateFields,
} from './listFacets'

interface FakeType {
  jsonType: 'string' | 'boolean' | 'number'
  title?: string
  options?: {list?: Array<string | {value?: string; title?: string}>}
}

function objectType(fields: Array<{name: string; type: FakeType}>): ObjectSchemaType {
  return {fields} as unknown as ObjectSchemaType
}

describe('getFacetCandidateFields', () => {
  it("classifies a boolean field as 'boolean'", () => {
    const candidates = getFacetCandidateFields(
      objectType([{name: 'locked', type: {jsonType: 'boolean', title: 'Locked'}}]),
    )
    expect(candidates).toEqual([{name: 'locked', title: 'Locked', kind: 'boolean'}])
  })

  it("classifies a string with options.list as 'enum' with normalized options", () => {
    const candidates = getFacetCandidateFields(
      objectType([
        {
          name: 'role',
          type: {
            jsonType: 'string',
            title: 'Role',
            options: {list: ['developer', {value: 'designer', title: 'Designer'}]},
          },
        },
      ]),
    )
    expect(candidates).toEqual([
      {
        name: 'role',
        title: 'Role',
        kind: 'enum',
        options: [
          {value: 'developer', title: 'developer'},
          {value: 'designer', title: 'Designer'},
        ],
      },
    ])
  })

  it("classifies a plain string field as 'string'", () => {
    const candidates = getFacetCandidateFields(
      objectType([{name: 'name', type: {jsonType: 'string', title: 'Name'}}]),
    )
    expect(candidates).toEqual([{name: 'name', title: 'Name', kind: 'string'}])
  })

  it('skips fields that are neither string nor boolean', () => {
    const candidates = getFacetCandidateFields(
      objectType([
        {name: 'count', type: {jsonType: 'number', title: 'Count'}},
        {name: 'name', type: {jsonType: 'string', title: 'Name'}},
      ]),
    )
    expect(candidates.map((candidate) => candidate.name)).toEqual(['name'])
  })

  it('caps the candidate list at MAX_CANDIDATES (6)', () => {
    const fields = Array.from({length: 10}, (_, index) => ({
      name: `f${index}`,
      type: {jsonType: 'boolean', title: `F${index}`} as FakeType,
    }))
    expect(getFacetCandidateFields(objectType(fields))).toHaveLength(6)
  })

  it('returns an empty array when the schema type is undefined', () => {
    expect(getFacetCandidateFields(undefined)).toEqual([])
  })
})

describe('buildFieldFacets', () => {
  it('always emits a boolean candidate with Yes/No options', () => {
    const facets = buildFieldFacets([{name: 'locked', title: 'Locked', kind: 'boolean'}], {})
    expect(facets).toEqual([
      {
        name: 'locked',
        title: 'Locked',
        options: [
          {value: true, title: 'Yes'},
          {value: false, title: 'No'},
        ],
      },
    ])
  })

  it('always emits an enum candidate with its declared options', () => {
    const facets = buildFieldFacets(
      [{name: 'role', title: 'Role', kind: 'enum', options: [{value: 'dev', title: 'Dev'}]}],
      {},
    )
    expect(facets).toEqual([{name: 'role', title: 'Role', options: [{value: 'dev', title: 'Dev'}]}])
  })

  it('emits a plain-string facet for low-cardinality repeated values', () => {
    const values: FacetValuesById = {
      a: {city: 'Vulcan'},
      b: {city: 'Vulcan'},
      c: {city: 'Andoria'},
    }
    const facets = buildFieldFacets([{name: 'city', title: 'City', kind: 'string'}], values)
    expect(facets).toEqual([
      {
        name: 'city',
        title: 'City',
        options: [
          {value: 'Andoria', title: 'Andoria'},
          {value: 'Vulcan', title: 'Vulcan'},
        ],
      },
    ])
  })

  it('drops a plain-string facet when every document is unique', () => {
    const values: FacetValuesById = {
      a: {city: 'Vulcan'},
      b: {city: 'Andoria'},
      c: {city: 'Betazed'},
    }
    expect(buildFieldFacets([{name: 'city', title: 'City', kind: 'string'}], values)).toEqual([])
  })

  it('caps the result at MAX_FACETS (4)', () => {
    const candidates: FacetCandidateField[] = Array.from({length: 6}, (_, index) => ({
      name: `b${index}`,
      title: `B${index}`,
      kind: 'boolean',
    }))
    expect(buildFieldFacets(candidates, {})).toHaveLength(4)
  })
})
