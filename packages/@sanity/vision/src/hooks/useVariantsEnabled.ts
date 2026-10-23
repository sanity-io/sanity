import {useWorkspace} from 'sanity'

/**
 * Whether the workspace has variants switched on (`beta.variants.enabled`). The studio gates its
 * own variant UI on this flag, the navbar's variant selector included, so Vision shows and sends
 * variants only where the navbar does.
 */
export function useVariantsEnabled(): boolean {
  return Boolean(useWorkspace().beta?.variants?.enabled)
}
