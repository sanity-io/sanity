import * as React from 'react'
import {Context} from './context'

export const Box = function Box(props: {id: string; children?: React.ReactNode, style?: React.CSSProperties}) {
  const ref = React.useRef<HTMLDivElement>()
  const context = React.useContext(Context)

  React.useEffect(() => {
    context.dispatch({
      type: 'mount',
      id: props.id,
      element: ref.current
    })
    return () => {
      context.dispatch({type: 'unmount', id: props.id})
    }
  }, [])

  React.useEffect(() => {
    context.dispatch({
      type: 'update',
      id: props.id,
      children: props.children
    })
  }, [props])

  return (
    // note the wrapper here must be a block element for ResizeObserver to work properly
    <div ref={ref} style={props.style}>
      {props.children || props.id}
    </div>
  )
}
