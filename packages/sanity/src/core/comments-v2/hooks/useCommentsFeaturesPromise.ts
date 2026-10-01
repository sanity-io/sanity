import {use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {CommentsFeaturesPromiseContextV2} from 'sanity/_singletons'

import {type SettledFeatures} from '../../hooks/useFeatureEnabled'

/** @internal */
export function useCommentsFeaturesPromise(): ObservablePromise<SettledFeatures> {
  const promise = use(CommentsFeaturesPromiseContextV2)
  if (!promise) throw new TypeError('CommentsFeaturesPromise: missing context value')
  return promise
}
