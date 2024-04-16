import {useFeatureEnabled} from '../../hooks'

/**
 * Use SWR to check if the current project supports scheduled publishing.
 * SWR will cache this value and prevent unnecessary re-fetching.
 */
function useHasScheduledPublishing(): boolean | undefined {
  const {enabled} = useFeatureEnabled('scheduledPublishing')
  return enabled
}

export default useHasScheduledPublishing
