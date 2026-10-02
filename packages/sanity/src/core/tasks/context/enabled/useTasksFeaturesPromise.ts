import {use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {TasksFeaturesPromiseContext} from 'sanity/_singletons'

import {type SettledFeatures} from '../../../hooks/useFeatureEnabled'

/** @internal */
export function useTasksFeaturesPromise(): ObservablePromise<SettledFeatures> {
  const promise = use(TasksFeaturesPromiseContext)
  if (!promise) throw new TypeError('TasksFeaturesPromise: missing context value')
  return promise
}
