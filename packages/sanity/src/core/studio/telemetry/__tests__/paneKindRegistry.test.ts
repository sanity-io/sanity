import {afterEach, describe, expect, it, vi} from 'vitest'

function importFresh() {
  return import('../paneKindRegistry')
}

async function importFreshAtCapacity() {
  const registry = await importFresh()
  Array.from({length: registry.MAX_ENTRIES}, (_unused, index) => `root;path-${index}`).forEach(
    (resolverPath) => {
      registry.recordStructurePaneKind('structure', resolverPath, 'document')
    },
  )
  return registry
}

describe('paneKindRegistry', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('evicts the oldest recorded path once the cap is reached', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFreshAtCapacity()
    expect(getStructurePaneKind('structure', 'path-0')).toBe('document')

    recordStructurePaneKind('structure', 'root;path-overflow', 'list')

    expect(getStructurePaneKind('structure', 'path-0')).toBeUndefined()
    expect(getStructurePaneKind('structure', 'path-1')).toBe('document')
    expect(getStructurePaneKind('structure', 'path-overflow')).toBe('list')
  })

  it('does not evict anything when overwriting an already-recorded path at the cap', async () => {
    const {recordStructurePaneKind, getStructurePaneKind} = await importFreshAtCapacity()

    recordStructurePaneKind('structure', 'root;path-0', 'list')

    expect(getStructurePaneKind('structure', 'path-0')).toBe('list')
    expect(getStructurePaneKind('structure', 'path-1')).toBe('document')
  })
})
