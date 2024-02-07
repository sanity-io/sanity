import {useFeatureEnabled} from '../../../core'

export function useResolveTasksEnabled() {
  const {enabled: featureEnabled, isLoading} = useFeatureEnabled('studioTasks')

  return true
}
