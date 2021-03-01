import classNames from 'classnames'
import React from 'react'
import {IntentLink} from 'part:@sanity/base/router'
import styles from 'part:@sanity/components/menus/default-style'
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

class DefaultMenuItem extends React.Component<DefaultMenuItemProps> {
  handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation()
    this.props.onAction(event, this.props.item)
  }

  handleFocus = (event: React.FocusEvent<HTMLAnchorElement>) => {
    this.props.onFocus(event, this.props.item)
  }

  renderLinkChildren = () => {
    const {item} = this.props
    const {icon: Icon, title} = item
    return (
      <React.Fragment>
        {Icon && (
          <span className={styles.iconContainer}>
            <Icon className={styles.icon} />
          </span>
        )}
        {title}
      </React.Fragment>
    )
  }

  renderIntentLink = () => {
    const {danger, item} = this.props
    const {intent} = item

    // @todo: is this what we want?
    if (!intent) return null

    return (
      <IntentLink
        onClick={this.handleClick}
        className={danger ? styles.dangerLink : styles.link}
        onFocus={this.handleFocus}
        tabIndex={0}
        intent={intent.type}
        params={intent.params}
      >
        {this.renderLinkChildren()}
      </IntentLink>
    )
  }

  renderFunctionLink = () => {
    const {isDisabled, danger} = this.props
    return (
      <a
        onClick={isDisabled ? undefined : this.handleClick}
        className={danger ? styles.dangerLink : styles.link}
        onFocus={this.handleFocus}
        tabIndex={0}
      >
        {this.renderLinkChildren()}
      </a>
    )
  }

  render() {
    const {className: classNameProp, isDisabled, isFocused, item} = this.props
    const {intent} = item
    const className = classNames(
      classNameProp,
      isFocused ? styles.focusedItem : styles.item,
      isDisabled && styles.isDisabled
    )

    return (
      <li className={className}>{intent ? this.renderIntentLink() : this.renderFunctionLink()}</li>
    )
  }
}

export default DefaultMenuItem
