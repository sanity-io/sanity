import {useSource} from '../../studio/source'

/**
 * @internal
 * @returns boolean indicating if the scheduled drafts feature is enabled
 */
export function useScheduledDraftsEnabled(): boolean {
  const source = useSource()
  const isEnabled = Boolean(source.scheduledDrafts?.enabled)

  return isEnabled
}
