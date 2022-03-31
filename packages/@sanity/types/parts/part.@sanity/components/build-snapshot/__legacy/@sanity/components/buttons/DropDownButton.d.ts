import React from 'react'
import {Placement} from '../types'
import {ButtonProps} from './types'
interface DropdownItem {
  title: string
  icon?: React.ComponentType<Record<string, unknown>>
  color?: string
}
interface DropdownButtonProps {
  items: DropdownItem[]
  onAction: (item: DropdownItem) => void
  loading?: boolean
  renderItem?: (item: DropdownItem) => React.ReactElement
  placement?: Placement
  portal?: boolean
  showArrow?: boolean
}
declare function DropdownButton(props: DropdownButtonProps & ButtonProps): JSX.Element
export default DropdownButton
