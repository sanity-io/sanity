import FieldsetPart from 'part:@sanity/components/fieldsets/default'
import {FormFieldPresence} from '@sanity/base/presence'
import React from 'react'
import {Marker, Path} from '@sanity/types'
import {ChangeIndicatorContextProvidedProps} from '@sanity/base/lib/change-indicators'

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
  className?: string
  tabIndex?: number
  transparent?: boolean
  styles?: Record<string, string>
  markers?: Marker[]
  presence?: FormFieldPresence[]
  changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
}

export const Fieldset = React.forwardRef(function Fieldset(
  props: Props,
  ref: React.ForwardedRef<{focus: () => void}>
) {
  return <FieldsetPart {...props} ref={ref} />
})
