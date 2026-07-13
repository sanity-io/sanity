import {describe, expect, it, vi} from 'vitest'

import {variantAlphaAudience} from '../../../../../variants/__fixtures__/variants.fixture'
import {getDocumentTableColumnDefs} from '../DocumentTableColumnDefs'

const t = ((key: string) => key) as Parameters<typeof getDocumentTableColumnDefs>[2]

const variantsById = new Map([[variantAlphaAudience._id, variantAlphaAudience]])

describe('getDocumentTableColumnDefs', () => {
  it('omits the bundle column when variants are disabled', () => {
    const columns = getDocumentTableColumnDefs('_.releases.rASAP', 'active', t, false, variantsById)
    const columnIds = columns.map((column) => column.id)

    expect(columnIds).not.toContain('bundle')
    expect(columnIds.indexOf('document._type')).toBeLessThan(columnIds.indexOf('search'))
  })

  it('includes the bundle column after type when variants are enabled', () => {
    const columns = getDocumentTableColumnDefs('_.releases.rASAP', 'active', t, true, variantsById)
    const columnIds = columns.map((column) => column.id)

    expect(columnIds).toContain('bundle')
    expect(columnIds.indexOf('bundle')).toBe(columnIds.indexOf('document._type') + 1)

    const bundleColumn = columns.find((column) => column.id === 'bundle')
    expect(bundleColumn).toMatchObject({
      sorting: true,
      width: 140,
    })
    expect(
      bundleColumn && 'sortTransform' in bundleColumn && bundleColumn.sortTransform,
    ).toBeTypeOf('function')
  })
})
