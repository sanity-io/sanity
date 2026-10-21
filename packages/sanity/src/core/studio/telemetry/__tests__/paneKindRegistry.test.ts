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

  it('evicts the oldest recorded path once the cap is reached', async () => {
    const {recordStructurePaneKind, getStructurePaneKind, MAX_ENTRIES} = await importFresh()

    Array.from({length: MAX_ENTRIES}, (_unused, index) => index).forEach((index) => {
      recordStructurePaneKind(`path-${index}`, 'document')
    })
    expect(getStructurePaneKind('path-0')).toBe('document')

    recordStructurePaneKind('path-overflow', 'list')

    expect(getStructurePaneKind('path-0')).toBeUndefined()
    expect(getStructurePaneKind('path-1')).toBe('document')
    expect(getStructurePaneKind('path-overflow')).toBe('list')
  })

  it('does not evict anything when overwriting an already-recorded path at the cap', async () => {
    const {recordStructurePaneKind, getStructurePaneKind, MAX_ENTRIES} = await importFresh()

    Array.from({length: MAX_ENTRIES}, (_unused, index) => index).forEach((index) => {
      recordStructurePaneKind(`path-${index}`, 'document')
    })

    recordStructurePaneKind('path-0', 'list')

    expect(getStructurePaneKind('path-0')).toBe('list')
    expect(getStructurePaneKind('path-1')).toBe('document')
  })
})
