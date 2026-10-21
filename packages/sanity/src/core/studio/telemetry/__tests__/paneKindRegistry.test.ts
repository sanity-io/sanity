import {afterEach, describe, expect, it, vi} from 'vitest'

function importFresh() {
  return import('../paneKindRegistry')
}

describe('paneKindRegistry', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('returns undefined for a path nothing has recorded', async () => {
    const {getStructurePaneKind} = await importFresh()

    expect(getStructurePaneKind('author;knut')).toBeUndefined()
  })

  it('returns the kind recorded for a path', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFresh()

    recordStructurePaneKind('author;knut', 'document')

    expect(getStructurePaneKind('author;knut')).toBe('document')
  })

  it('keeps separate paths independent', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFresh()

    recordStructurePaneKind('author', 'list')
    recordStructurePaneKind('author;knut', 'document')

    expect(getStructurePaneKind('author')).toBe('list')
    expect(getStructurePaneKind('author;knut')).toBe('document')
  })

  it('overwrites a previously recorded kind for the same path', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFresh()

    recordStructurePaneKind('author;knut', 'other')
    recordStructurePaneKind('author;knut', 'document')

    expect(getStructurePaneKind('author;knut')).toBe('document')
  })
})
