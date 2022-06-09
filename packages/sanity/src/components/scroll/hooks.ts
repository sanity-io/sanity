import React from 'react'
import {ScrollContext} from './scrollContext'
import {Subscriber} from 'nano-pubsub'

export function useOnScroll(callback: Subscriber<Event>) {
  const parentContext = React.useContext(ScrollContext)
  React.useEffect(() => {
    return parentContext?.subscribe(callback)
  }, [callback])
}
