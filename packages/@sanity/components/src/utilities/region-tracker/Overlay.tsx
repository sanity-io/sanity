import * as React from 'react'
import {ReportedRegion} from './types'

const Noop = () => null

export const PositionsOverlay = function PositionsOverlay<RegionData>(props: {
  regions: ReportedRegion<RegionData>[]
  renderWith: React.ComponentType<{regions: ReportedRegion<RegionData>[]}>
}) {
  const {regions, renderWith: Component = Noop, ...rest} = props

  return <Component regions={regions} />
}
