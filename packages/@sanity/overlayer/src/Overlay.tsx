import * as React from 'react'
import {OverlayItem} from './types'

const Noop = () => null

export const Overlay = function PositionsOverlay(props: {
  regions: OverlayItem[]
  renderWith: React.ComponentType<{regions: OverlayItem[]}>
}) {
  const {regions, renderWith: Component = Noop, ...rest} = props

  return <Component regions={regions} />
}
