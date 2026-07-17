import {type DocumentPairTarget} from './types'

/**
 * Normalizes the `version` parameter accepted by the document pair APIs
 * (`useDocumentOperation`, `pair.editOperations`) to a {@link DocumentPairTarget}.
 *
 * A bare string is back-compat shorthand for a plain version target — the scope id, i.e. the
 * `<scopeId>` segment of `versions.<scopeId>.<groupId>` (a release or agent/anonymous bundle
 * name); target objects pass through by reference, and `undefined` means the base
 * draft/published pair.
 *
 */
export function normalizeDocumentPairTarget(
  version: string | DocumentPairTarget | undefined,
): DocumentPairTarget | undefined {
  if (typeof version === 'string') {
    return {kind: 'version', scopeId: version}
  }
  return version
}

/**
 * The scope id (the `<scopeId>` segment of `versions.<scopeId>.<groupId>`) the pair should check
 * out for a target, or `undefined` when the base draft/published pair applies. Guarded kinds
 * (`target-missing`, `unresolved`) never reach pair checkout and yield `undefined`.
 *
 */
export function getPairTargetScopeId(target: DocumentPairTarget | undefined): string | undefined {
  if (target?.kind === 'version' || target?.kind === 'variant') {
    return target.scopeId
  }
  return undefined
}
