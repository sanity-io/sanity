// This is transitional in order to track usage of the ValidationStatus part from within the form-builder package
// and to ease migration towards a part-less studio
import React from 'react'
import {Marker} from '@sanity/types'
import {ValidationStatusPart} from '../legacyParts'

// Note: these are the props currently in use
interface Props {
  markers: Marker[]
  placement?: 'bottom'
  showSummary?: boolean
}
export const ValidationStatus = React.forwardRef(function ValidationStatus(
  props: Props,
  ref: React.ForwardedRef<{focus: () => void}>
) {
  return <ValidationStatusPart {...props} ref={ref} />
})
