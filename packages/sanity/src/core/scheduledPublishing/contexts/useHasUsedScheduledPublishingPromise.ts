import {use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {HasUsedScheduledPublishingPromiseContext} from 'sanity/_singletons'

import {type HasUsedScheduledPublishing} from '../tool/contexts/useHasUsedScheduledPublishing'

/** @internal */
export function useHasUsedScheduledPublishingPromise(): ObservablePromise<HasUsedScheduledPublishing> {
  const promise = use(HasUsedScheduledPublishingPromiseContext)
  if (!promise) throw new TypeError('HasUsedScheduledPublishingPromise: missing context value')
  return promise
}
