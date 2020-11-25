import React from 'react'
import {Marker} from '@sanity/types'
import {Placement} from '../types'
interface ValidationStatusProps {
  hideTooltip?: boolean
  markers: Marker[]
  placement?: Placement
  showSummary?: boolean
}
declare function ValidationStatus(
  props: ValidationStatusProps & React.HTMLProps<HTMLDivElement>
): JSX.Element
export default ValidationStatus
