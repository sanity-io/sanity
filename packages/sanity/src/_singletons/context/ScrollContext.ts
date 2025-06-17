import type {PubSub} from 'nano-pubsub'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const ScrollContext: React.Context<null | PubSub<Event>> =
  createContext<null | PubSub<Event>>('sanity/_singletons/context/scroll', null)
