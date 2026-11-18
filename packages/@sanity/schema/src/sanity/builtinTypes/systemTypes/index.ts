import releaseDocument from './release'

/**
 * Built-in documents that Content Lake owns and writes through actions. They
 * reference extendable types: when a schema extends one, the compiler compiles
 * these again in that schema so they use the extension. A schema can't declare them.
 */
export const systemDocumentTypes = [releaseDocument]

const systemDocumentTypeNames = new Set<unknown>(systemDocumentTypes.map((type) => type.name))

export function isSystemDocumentTypeName(typeName: unknown): boolean {
  return systemDocumentTypeNames.has(typeName)
}
