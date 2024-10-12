import {shareReplayLatest} from '../../preview/utils/shareReplayLatest'
import {memoize} from '../_legacy/document/utils/createMemoizer'
import {observeLiveEvents} from './observeLiveEvents'

export const getGlobalLiveClient = memoize(
  (config: {dataset: string; projectId: string}) =>
    observeLiveEvents(config).pipe(shareReplayLatest((event) => event.type === 'welcome')),
  (config) => config.projectId + config.dataset,
)
