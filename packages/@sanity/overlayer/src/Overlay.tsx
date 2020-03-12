import * as React from 'react'
import {OverlayItem} from './types'

const Noop = () => null

export const Overlay = function PositionsOverlay(props: {
  items: OverlayItem[]
  renderWith: React.ComponentType<{items: OverlayItem[]}>
}) {
  const {items, renderWith: Component = Noop, ...rest} = props

  return <Component items={items} />
}
