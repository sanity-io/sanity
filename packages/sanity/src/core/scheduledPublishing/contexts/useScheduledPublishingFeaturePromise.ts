import {use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {ScheduledPublishingFeaturePromiseContext} from 'sanity/_singletons'

import {type SettledFeatures} from '../../hooks/useFeatureEnabled'

/** @internal */
export function useScheduledPublishingFeaturePromise(): ObservablePromise<SettledFeatures> {
  const promise = use(ScheduledPublishingFeaturePromiseContext)
  if (!promise) throw new TypeError('ScheduledPublishingFeaturePromise: missing context value')
  return promise
}
