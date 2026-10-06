import {use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {CommentsFeaturesPromiseContext} from 'sanity/_singletons'

import {type SettledFeatures} from '../../hooks/useFeatureEnabled'

/** @internal */
export function useCommentsFeaturesPromise(): ObservablePromise<SettledFeatures> {
  const promise = use(CommentsFeaturesPromiseContext)
  if (!promise) throw new TypeError('CommentsFeaturesPromise: missing context value')
  return promise
}
