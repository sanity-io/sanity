import React from 'react'
import {MenuItem as MenuItemType} from './types'
interface DefaultMenuItemProps {
  isFocused?: boolean
  onFocus: (event: React.FocusEvent<HTMLAnchorElement>, item: MenuItemType) => void
  onAction: (event: React.MouseEvent<HTMLAnchorElement>, item: MenuItemType) => void
  className?: string
  danger?: boolean
  isDisabled?: boolean
  item: MenuItemType
}
declare class DefaultMenuItem extends React.Component<DefaultMenuItemProps> {
  handleClick: (event: React.MouseEvent<HTMLAnchorElement>) => void
  handleFocus: (event: React.FocusEvent<HTMLAnchorElement>) => void
  renderLinkChildren: () => JSX.Element
  renderIntentLink: () => JSX.Element
  renderFunctionLink: () => JSX.Element
  render(): JSX.Element
}
export default DefaultMenuItem
