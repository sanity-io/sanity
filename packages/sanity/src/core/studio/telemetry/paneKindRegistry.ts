/** @internal */
export type StructurePaneKind = 'list' | 'document' | 'other'

// Pane kinds are resolved inside `structure/`, which core cannot import, so the structure tool records them here.
const paneKindByPath = new Map<string, StructurePaneKind>()

/** @internal */
export function recordStructurePaneKind(path: string, kind: StructurePaneKind): void {
  paneKindByPath.set(path, kind)
}

/** @internal */
export function getStructurePaneKind(path: string): StructurePaneKind | undefined {
  return paneKindByPath.get(path)
}
