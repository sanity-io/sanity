/** @internal */
export type StructurePaneKind = 'list' | 'document' | 'other'

// Pane kinds are resolved inside `structure/`, which core cannot import, so the structure tool records them here.
const paneKindByPath = new Map<string, StructurePaneKind>()

// Caps memory in a long-running session; eviction is oldest-recorded-path-first.
export const MAX_ENTRIES = 500

/** @internal */
export function recordStructurePaneKind(path: string, kind: StructurePaneKind): void {
  if (paneKindByPath.has(path)) {
    paneKindByPath.set(path, kind)
    return
  }

  if (paneKindByPath.size >= MAX_ENTRIES) {
    const [oldestPath] = paneKindByPath.keys()
    paneKindByPath.delete(oldestPath)
  }

  paneKindByPath.set(path, kind)
}

/** @internal */
export function getStructurePaneKind(path: string): StructurePaneKind | undefined {
  return paneKindByPath.get(path)
}
