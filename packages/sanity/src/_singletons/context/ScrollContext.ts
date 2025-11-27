import type {PubSub} from 'nano-pubsub'
import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const ScrollContext: Context<null | PubSub<Event>> = createContext<null | PubSub<Event>>(
  'sanity/_singletons/context/scroll',
  null,
)
