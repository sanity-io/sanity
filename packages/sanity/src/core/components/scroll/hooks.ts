import {type Subscriber} from 'nano-pubsub'
import {useContext, useEffect} from 'react'
import {ScrollContext} from 'sanity/_singletons'

/** @internal */
export function useOnScroll(callback: Subscriber<Event>) {
  const parentContext = useContext(ScrollContext)
  useEffect(() => {
    return parentContext?.subscribe(callback)
  }, [callback, parentContext])
}
