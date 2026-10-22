import {afterEach, describe, expect, it, vi} from 'vitest'

function importFresh() {
  return import('../paneKindRegistry')
}

async function importFreshAtCapacity() {
  const registry = await importFresh()
  Array.from({length: registry.MAX_ENTRIES}, (_unused, index) => `path-${index}`).forEach(
    (path) => {
      registry.recordStructurePaneKind('structure', path, 'document')
    },
  )
  return registry
}

describe('paneKindRegistry', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('returns undefined for a path nothing has recorded', async () => {
    const {getStructurePaneKind} = await importFresh()

    expect(getStructurePaneKind('structure', 'author;knut')).toBeUndefined()
  })

  it('returns the kind recorded for a path', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFresh()

    recordStructurePaneKind('structure', 'author;knut', 'document')

    expect(getStructurePaneKind('structure', 'author;knut')).toBe('document')
  })

  it('keeps separate paths independent', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFresh()

    recordStructurePaneKind('structure', 'author', 'list')
    recordStructurePaneKind('structure', 'author;knut', 'document')

    expect(getStructurePaneKind('structure', 'author')).toBe('list')
    expect(getStructurePaneKind('structure', 'author;knut')).toBe('document')
  })

  it('overwrites a previously recorded kind for the same path', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFresh()

    recordStructurePaneKind('structure', 'author;knut', 'other')
    recordStructurePaneKind('structure', 'author;knut', 'document')

    expect(getStructurePaneKind('structure', 'author;knut')).toBe('document')
  })

  it('evicts the oldest recorded path once the cap is reached', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFreshAtCapacity()
    expect(getStructurePaneKind('structure', 'path-0')).toBe('document')

    recordStructurePaneKind('structure', 'path-overflow', 'list')

    expect(getStructurePaneKind('structure', 'path-0')).toBeUndefined()
    expect(getStructurePaneKind('structure', 'path-1')).toBe('document')
    expect(getStructurePaneKind('structure', 'path-overflow')).toBe('list')
  })

  it('does not evict anything when overwriting an already-recorded path at the cap', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFreshAtCapacity()

    recordStructurePaneKind('structure', 'path-0', 'list')

    expect(getStructurePaneKind('structure', 'path-0')).toBe('list')
    expect(getStructurePaneKind('structure', 'path-1')).toBe('document')
  })

  it('keeps the same path independent across two differently named structure tools', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFresh()

    recordStructurePaneKind('structure', 'author;knut', 'document')
    recordStructurePaneKind('cars', 'author;knut', 'list')

    expect(getStructurePaneKind('structure', 'author;knut')).toBe('document')
    expect(getStructurePaneKind('cars', 'author;knut')).toBe('list')
  })

  it('tracks a registered structure tool name and nothing else', async () => {
    const {recordStructureTool, isStructureTool} = await importFresh()

    recordStructureTool('cars')

    expect(isStructureTool('cars')).toBe(true)
    expect(isStructureTool('vision')).toBe(false)
  })

  it('strips the resolver path root id by position when deriving a registry path', async () => {
    const {toRegistryPath} = await importFresh()

    expect(toRegistryPath('root;book;knut')).toBe('book;knut')
    expect(toRegistryPath('custom-root;book;knut')).toBe('book;knut')
  })
})
