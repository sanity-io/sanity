import {type PubSub} from 'nano-pubsub'
import {createContext} from 'react'

/**
 * @internal
 * @hidden
 */
export const ScrollContext = createContext<null | PubSub<Event>>(null)
