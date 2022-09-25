import React from 'react'
import {PubSub} from 'nano-pubsub'

export const ScrollContext = React.createContext<null | PubSub<Event>>(null)
