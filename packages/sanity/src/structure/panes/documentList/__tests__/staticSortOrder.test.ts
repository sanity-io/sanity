import {Schema} from '@sanity/schema'
import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {fromStaticSortOrder, toStaticSortOrder} from '../helpers'
import {type SortOrder, type StaticSortOrder} from '../types'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'book',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'publicationYear', type: 'number'},
      ],
    },
  ],
})

const bookType = mockSchema.get('book') as ObjectSchemaType

describe('toStaticSortOrder', () => {
  test('strips schemaType from each entry', () => {
    const sortOrder: SortOrder = {
      by: [{field: 'title', direction: 'asc', schemaType: bookType}],
    }
    const staticSortOrder = toStaticSortOrder(sortOrder)
    expect(staticSortOrder).toEqual({by: [{field: 'title', direction: 'asc'}]})
    expect((staticSortOrder.by[0] as {schemaType?: unknown}).schemaType).toBeUndefined()
  })

  test('strips projectionIndex from each entry', () => {
    const sortOrder: SortOrder = {
      by: [{field: 'translations.se', direction: 'asc', projectionIndex: 0}],
    }
    const staticSortOrder = toStaticSortOrder(sortOrder)
    expect(staticSortOrder).toEqual({by: [{field: 'translations.se', direction: 'asc'}]})
    expect((staticSortOrder.by[0] as {projectionIndex?: unknown}).projectionIndex).toBeUndefined()
  })

  test('preserves mapWith and nulls', () => {
    const sortOrder: SortOrder = {
      by: [
        {
          field: 'title',
          direction: 'asc',
          mapWith: 'lower',
          nulls: 'last',
          schemaType: bookType,
          projectionIndex: 2,
        },
      ],
    }
    const staticSortOrder = toStaticSortOrder(sortOrder)
    expect(staticSortOrder).toEqual({
      by: [{field: 'title', direction: 'asc', mapWith: 'lower', nulls: 'last'}],
    })
  })

  test('omits absent optional fields rather than writing undefined', () => {
    const sortOrder: SortOrder = {
      by: [{field: 'title', direction: 'asc'}],
    }
    const staticSortOrder = toStaticSortOrder(sortOrder)
    expect(Object.keys(staticSortOrder.by[0]).sort()).toEqual(['direction', 'field'])
  })

  test('produces a JSON-safe shape (no live schema objects)', () => {
    const sortOrder: SortOrder = {
      by: [
        {field: 'title', direction: 'asc', schemaType: bookType},
        {field: 'publicationYear', direction: 'desc', projectionIndex: 1, schemaType: bookType},
      ],
    }
    const staticSortOrder = toStaticSortOrder(sortOrder)
    // Round-trip through JSON to confirm nothing throws and the
    // output is identical (i.e. no non-serializable references).
    const roundtripped = JSON.parse(JSON.stringify(staticSortOrder))
    expect(roundtripped).toEqual(staticSortOrder)
  })
})

describe('fromStaticSortOrder', () => {
  test('returns undefined for undefined input', () => {
    expect(fromStaticSortOrder(undefined, bookType)).toBeUndefined()
  })

  test('attaches the pane schemaType to each entry', () => {
    const staticSortOrder: StaticSortOrder = {
      by: [{field: 'title', direction: 'asc'}],
    }
    const hydrated = fromStaticSortOrder(staticSortOrder, bookType)
    expect(hydrated).toEqual({
      by: [{field: 'title', direction: 'asc', schemaType: bookType}],
    })
  })

  test('does not attach a schemaType when none is available', () => {
    const staticSortOrder: StaticSortOrder = {
      by: [{field: 'title', direction: 'asc'}],
    }
    const hydrated = fromStaticSortOrder(staticSortOrder, undefined)
    expect(hydrated).toEqual({by: [{field: 'title', direction: 'asc'}]})
    expect((hydrated?.by[0] as {schemaType?: unknown}).schemaType).toBeUndefined()
  })

  test('does not attach a projectionIndex (regenerated downstream by compileSortExpression)', () => {
    const staticSortOrder: StaticSortOrder = {
      by: [{field: 'translations.se', direction: 'asc'}],
    }
    const hydrated = fromStaticSortOrder(staticSortOrder, bookType)
    expect((hydrated?.by[0] as {projectionIndex?: unknown}).projectionIndex).toBeUndefined()
  })

  test('preserves mapWith and nulls when hydrating', () => {
    const staticSortOrder: StaticSortOrder = {
      by: [{field: 'title', direction: 'asc', mapWith: 'lower', nulls: 'last'}],
    }
    const hydrated = fromStaticSortOrder(staticSortOrder, bookType)
    expect(hydrated).toEqual({
      by: [
        {
          field: 'title',
          direction: 'asc',
          mapWith: 'lower',
          nulls: 'last',
          schemaType: bookType,
        },
      ],
    })
  })

  test('tolerates legacy persisted state with extendedProjection at the wrapper level', () => {
    // Old persisted state. The new code should silently ignore the
    // unknown `extendedProjection` key and successfully hydrate the
    // entries it does understand.
    const legacy = {
      by: [{field: 'title', direction: 'asc' as const}],
      extendedProjection: 'title',
    } as unknown as StaticSortOrder
    const hydrated = fromStaticSortOrder(legacy, bookType)
    expect(hydrated).toEqual({
      by: [{field: 'title', direction: 'asc', schemaType: bookType}],
    })
    // `extendedProjection` is dropped on hydration.
    expect(
      (hydrated as unknown as {extendedProjection?: unknown}).extendedProjection,
    ).toBeUndefined()
  })

  test('tolerates static sort order with no `by` array (treats as empty)', () => {
    // Defensive case: legacy reads or partial settings can yield a
    // value without a `by` array. Hydration must not throw.
    const broken = {} as unknown as StaticSortOrder
    const hydrated = fromStaticSortOrder(broken, bookType)
    expect(hydrated).toEqual({by: []})
  })

  test('round-trip: hydrate then re-staticify drops runtime fields', () => {
    const staticSortOrder: StaticSortOrder = {
      by: [
        {field: 'title', direction: 'asc'},
        {field: 'publicationYear', direction: 'desc', mapWith: 'dateTime'},
      ],
    }
    const hydrated = fromStaticSortOrder(staticSortOrder, bookType)!
    // Add a projectionIndex as if a search strategy had run.
    hydrated.by[0] = {...hydrated.by[0], projectionIndex: 0}

    const restaticified = toStaticSortOrder(hydrated)
    expect(restaticified).toEqual(staticSortOrder)
    // Confirm no runtime-only fields leaked.
    for (const entry of restaticified.by) {
      expect((entry as {schemaType?: unknown}).schemaType).toBeUndefined()
      expect((entry as {projectionIndex?: unknown}).projectionIndex).toBeUndefined()
    }
  })
})
