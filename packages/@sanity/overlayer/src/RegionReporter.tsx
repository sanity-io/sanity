import * as React from 'react'
import {Context} from './context'

export const RegionReporter = React.memo(function RegionReporter(props: {
  id: string
  data: any
  children?: React.ReactNode
  childComponent: React.ComponentType
  style?: React.CSSProperties
}) {
  const {id, childComponent, data} = props
  const ref = React.useRef<HTMLDivElement>()
  const context = React.useContext(Context)

  React.useEffect(() => {
    context.dispatch({
      type: 'mount',
      id,
      element: ref.current,
      data,
      component: childComponent
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
      component: childComponent
    })
  }, [props])

  const Component = childComponent
  return (
    // note the wrapper here must be a block element for ResizeObserver to work properly
    <div ref={ref} style={{display: 'inline-block', visibility: 'hidden', ...props.style}}>
      <Component {...data} />
    </div>
  )
})
