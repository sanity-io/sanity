import {useWorkspace} from '../../studio/workspace'

/**
 * Configured metadata fields are edited only while `beta.variants` is on.
 * That flag is what turns release editing into the dialog.
 *
 * @internal
 */
export function useReleaseMetadataFieldsEnabled(): boolean {
  const {beta, releases} = useWorkspace()
  return Boolean(beta?.variants?.enabled) && (releases?.metadata?.fields?.length ?? 0) > 0
}
