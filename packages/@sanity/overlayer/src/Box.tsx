import * as React from 'react'
import {Context} from './context'
import shallowEquals from 'shallow-equals'

export const Box = React.memo(function PresenceTrackerBox(props: any) {
  const ref = React.useRef<HTMLDivElement>()
  const context = React.useContext(Context)

  React.useEffect(() => {
    context.dispatch({type: 'mount', key: props.id, element: ref.current})
    return () => {
      context.dispatch({type: 'unmount', key: props.id})
    }
  }, [])

  React.useEffect(() => {}, [])
  return <span ref={ref}>{props.children}</span>
}, shallowEquals)
