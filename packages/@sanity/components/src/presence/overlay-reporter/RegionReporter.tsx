import * as React from 'react'
import {Context} from './context'

export const RegionReporter = React.memo(function RegionReporter<Data>(props: {
  id: string
  data: Data
  children?: React.ReactNode
  component: React.ComponentType<Data>
  style?: React.CSSProperties
}) {
  const {id, component, data} = props
  const ref = React.useRef<HTMLDivElement>()
  const context = React.useContext(Context)

  React.useEffect(() => {
    context.dispatch({
      type: 'mount',
      id,
      element: ref.current,
      data,
      component
    })
    return () => {
      context.dispatch({type: 'unmount', id})
    }
  }, [])

  React.useEffect(() => {
    context.dispatch({
      type: 'update',
      id,
      data,
      component
    })
  }, [props])

  const Component = component
  return (
    // note the wrapper here must be a block element for ResizeObserver to work properly
    <div ref={ref} style={{display: 'inline-block', visibility: 'hidden', ...props.style}}>
      <Component {...data} />
    </div>
  )
})
