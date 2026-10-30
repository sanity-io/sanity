/** @internal */
export type StructurePaneKind = 'list' | 'document' | 'other'

// Pane kinds are resolved inside `structure/`, which core cannot import, so the structure tool records them here.
const paneKindByKey = new Map<string, StructurePaneKind>()
const structureToolNames = new Set<string>()

// Caps memory in a long-running session; eviction is oldest-recorded-key-first.
export const MAX_ENTRIES = 500

function toRegistryKey(toolName: string, registryPath: string): string {
  return JSON.stringify([toolName, registryPath])
}

/** @internal */
export function recordStructureTool(toolName: string): void {
  structureToolNames.add(toolName)
}

/** @internal */
export function isStructureTool(toolName: string): boolean {
  return structureToolNames.has(toolName)
}

/** @internal */
export function recordStructurePaneKind(
  toolName: string,
  resolverPath: string,
  kind: StructurePaneKind,
): void {
  // The resolver path leads with the root node's id, absent from the URL; drop by position as custom structures rename it.
  const registryPath = resolverPath.split(';').slice(1).join(';')
  const key = toRegistryKey(toolName, registryPath)

  paneKindByKey.delete(key)
  paneKindByKey.set(key, kind)

  if (paneKindByKey.size > MAX_ENTRIES) {
    const [oldestKey] = paneKindByKey.keys()
    paneKindByKey.delete(oldestKey)
  }
}

/** @internal */
export function getStructurePaneKind(
  toolName: string,
  registryPath: string,
): StructurePaneKind | undefined {
  return paneKindByKey.get(toRegistryKey(toolName, registryPath))
}
