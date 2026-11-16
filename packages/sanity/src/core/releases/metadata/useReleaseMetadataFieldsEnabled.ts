import {useWorkspace} from '../../studio/workspace'

/**
 * Configured metadata fields are edited in the release details dialog, which every project gets
 * with the redesigned release detail (Studio v6), so they are on whenever fields are configured.
 *
 * @internal
 */
export function useReleaseMetadataFieldsEnabled(): boolean {
  const {releases} = useWorkspace()
  return (releases?.metadata?.fields?.length ?? 0) > 0
}
