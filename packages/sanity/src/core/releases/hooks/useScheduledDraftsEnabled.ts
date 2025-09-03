import {QUOTA_EXCLUDED_RELEASES_ENABLED} from '../../config/types'
import {useSource} from '../../studio/source'

/**
 * @internal
 * @returns boolean indicating if the scheduled drafts feature is enabled
 */
export function useScheduledDraftsEnabled(): boolean {
  const source = useSource()
  const sourceInternal = (source as any).__internal
  const isEnabled = Boolean(sourceInternal?.options?.[QUOTA_EXCLUDED_RELEASES_ENABLED])

  return isEnabled
}
