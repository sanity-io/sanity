import {createContext} from 'sanity/_createContext'

import type {ActivityKeepAlive} from '../../core/studio/mountedTools/activityKeepAlive'

/**
 * The keep-alive of the mounted tool the component renders in (see `beta.reactActivityMode`),
 * or `null` outside one.
 *
 * @internal
 */
export const ActivityKeepAliveContext = createContext<ActivityKeepAlive | null>(
  'sanity/_singletons/context/activityKeepAlive',
  null,
)
