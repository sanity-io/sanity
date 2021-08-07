import React from 'react'
import {ReportedRegionWithRect, RegionWithIntersectionDetails, FieldPresenceData} from '../types'
declare type Props = {
  regions: ReportedRegionWithRect<FieldPresenceData>[]
  render: (
    regionsWithIntersectionDetails: RegionWithIntersectionDetails[],
    containerWidth: number
  ) => React.ReactNode | null
  children: React.ReactNode
  margins: [number, number, number, number]
}
export declare const RegionsWithIntersections: React.ForwardRefExoticComponent<
  Props & React.RefAttributes<unknown>
>
export {}
