import type React from 'react'
import type {ValidationMarker} from '_self_'
import type {Placement} from '../types'

interface ValidationStatusProps {
  hideTooltip?: boolean
  validation: ValidationMarker[]
  placement?: Placement
  showSummary?: boolean
}

declare function ValidationStatus(
  props: ValidationStatusProps & React.HTMLProps<HTMLDivElement>
): JSX.Element

export default ValidationStatus
