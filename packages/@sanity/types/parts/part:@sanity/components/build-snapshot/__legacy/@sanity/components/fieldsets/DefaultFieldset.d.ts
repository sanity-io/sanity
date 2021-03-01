import React from 'react'
import {Marker, Path} from '@sanity/types'
import {ChangeIndicatorContextProvidedProps} from '../../../../change-indicators'
import {FormFieldPresence} from '../../../../presence'
interface FieldsetProps {
  description?: string
  legend: string
  columns?: number
  isCollapsible?: boolean
  onFocus?: (path: Path) => void
  isCollapsed?: boolean
  fieldset: {
    description?: string
    legend?: string
  }
  children?: React.ReactNode
  level?: number
  className?: string
  tabIndex?: number
  transparent?: boolean
  styles?: Record<string, string>
  markers?: Marker[]
  presence: FormFieldPresence[]
  changeIndicator: ChangeIndicatorContextProvidedProps | boolean
}
interface State {
  isCollapsed: boolean
  hasBeenToggled: boolean
}
export default class Fieldset extends React.PureComponent<FieldsetProps, State> {
  _focusElement: HTMLDivElement | null
  static defaultProps: {
    children: any
    className: string
    columns: any
    description: any
    level: number
    fieldset: {}
    isCollapsed: boolean
    isCollapsible: boolean
    markers: any[]
    onFocus: any
    styles: any
    tabIndex: any
    transparent: any
    changeIndicator: boolean
    presence: any[]
  }
  constructor(props: FieldsetProps)
  handleToggle: () => void
  handleFocus: (event: React.FocusEvent<HTMLDivElement>) => void
  focus(): void
  setFocusElement: (el: HTMLDivElement | null) => void
  render(): JSX.Element
}
export {}
