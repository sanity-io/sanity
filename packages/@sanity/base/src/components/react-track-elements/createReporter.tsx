import * as React from 'react'
import {DelegateComponentType, OverlayReporterContext} from './types'

export const createReporter = (Context: React.Context<OverlayReporterContext>) =>
  React.memo(function RegionReporter<Data>(props: {
    // todo: fix wonky typings
    id: string
    data: Data
    children?: React.ReactNode
    component?: DelegateComponentType<Data>
    style?: React.CSSProperties
    className?: string
  }) {
    const {id, component = 'div', data, ...rest} = props
    const ref = React.useRef()
    const context = React.useContext(Context)

    React.useEffect(() => {
      context.dispatch({
        type: 'update',
        id,
        data,
        component
      })
    }, [props])

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

    return React.createElement(component, {
      ref,
      style: props.style,
      ...data,
      ...rest
    })
  })
