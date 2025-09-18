import {useSource} from '../../studio/source'

/**
 * @internal
 * @returns boolean indicating if the scheduled drafts feature is enabled
 */
export function useScheduledDraftsEnabled(): boolean {
  const source = useSource()

  // Default to true if releases are not configured
  return source.releases?.scheduledDrafts?.enabled ?? true
}
