import type {PubSub} from 'nano-pubsub'
import {createContext} from 'react'

/**
 * @internal
 */
export const ScrollContext = createContext<null | PubSub<Event>>(null)
