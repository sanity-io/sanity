import {useContext, useEffect} from 'react'
import {ScrollContext} from './scrollContext'
import {Subscriber} from 'nano-pubsub'

/** @internal */
export function useOnScroll(callback: Subscriber<Event>) {
  const parentContext = useContext(ScrollContext)
  useEffect(() => {
    return parentContext?.subscribe(callback)
  }, [callback, parentContext])
}
