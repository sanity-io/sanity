import React from 'react'
import {Subscriber} from 'nano-pubsub'
import {ScrollContext} from './scrollContext'

/** @internal */
export function useOnScroll(callback: Subscriber<Event>) {
  const parentContext = React.useContext(ScrollContext)
  React.useEffect(() => {
    return parentContext?.subscribe(callback)
  }, [callback, parentContext])
}
