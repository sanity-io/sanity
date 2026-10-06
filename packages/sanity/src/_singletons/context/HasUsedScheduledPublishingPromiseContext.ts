import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {HasUsedScheduledPublishing} from '../../core/scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'

/**
 * Whether the dataset has ever scheduled anything, as a promise for `use()`, provided by
 * `SchedulePublishingStudioProvider`.
 * @internal
 */
export const HasUsedScheduledPublishingPromiseContext =
  createContext<ObservablePromise<HasUsedScheduledPublishing> | null>(
    'sanity/_singletons/context/has-used-scheduled-publishing-promise',
    null,
  )
