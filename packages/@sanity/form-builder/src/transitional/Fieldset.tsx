// This is transitional in order to track usage of the Fieldset part from within the form-builder package
// in order to ease migration towards a part-less studio
import React from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {Marker, Path} from '@sanity/types'
import {FieldsetPart} from '../legacyParts'

interface Props {
  description?: string
  legend?: string
  columns?: number
  isCollapsible?: boolean
  onFocus?: (path: Path) => void
  onBlur?: (e: React.FocusEvent<unknown>) => void
  onClick?: (e: React.MouseEvent<unknown>) => void
  isCollapsed?: boolean
  children?: React.ReactNode
  level?: number
  tabIndex?: number
  markers?: Marker[]
  presence?: FormFieldPresence[]
  changeIndicator?: {compareDeep: boolean} | boolean
}

export const Fieldset = React.forwardRef(function Fieldset(
  props: Props,
  ref: React.ForwardedRef<{focus: () => void}>
) {
  return <FieldsetPart {...props} ref={ref} />
})
