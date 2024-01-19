import {createContext} from 'react'
import {PubSub} from 'nano-pubsub'

export const ScrollContext = createContext<null | PubSub<Event>>(null)
