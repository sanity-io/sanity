/** @internal */
export type StructurePaneKind = 'list' | 'document' | 'other'

// Pane kinds are resolved inside `structure/`, which core cannot import, so the structure tool records them here.
const paneKindByKey = new Map<string, StructurePaneKind>()
const structureToolNames = new Set<string>()

// Caps memory in a long-running session; eviction is oldest-recorded-key-first.
export const MAX_ENTRIES = 500

function toRegistryKey(toolName: string, path: string): string {
  return JSON.stringify([toolName, path])
}

/** @internal */
export function recordStructureTool(toolName: string): void {
  structureToolNames.add(toolName)
}

/** @internal */
export function isStructureTool(toolName: string): boolean {
  return structureToolNames.has(toolName)
}

// The resolver path leads with the root node's id, absent from the URL; drop by position as custom structures rename it.
/** @internal */
export function toRegistryPath(resolverPath: string): string {
  return resolverPath.split(';').slice(1).join(';')
}

/** @internal */
export function recordStructurePaneKind(
  toolName: string,
  path: string,
  kind: StructurePaneKind,
): void {
  const key = toRegistryKey(toolName, path)

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
  path: string,
): StructurePaneKind | undefined {
  return paneKindByKey.get(toRegistryKey(toolName, path))
}
