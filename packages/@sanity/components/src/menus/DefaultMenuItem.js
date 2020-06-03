import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import {IntentLink} from 'part:@sanity/base/router'
import styles from 'part:@sanity/components/menus/default-style'

class DefaultMenuItem extends React.Component {
  static propTypes = {
    isFocused: PropTypes.bool,
    onFocus: PropTypes.func.isRequired,
    onAction: PropTypes.func.isRequired,
    className: PropTypes.string,
    danger: PropTypes.bool,
    isDisabled: PropTypes.bool,
    item: PropTypes.shape({
      title: PropTypes.node.isRequired,
      icon: PropTypes.func,
      intent: PropTypes.shape({
        type: PropTypes.string.isRequired,
        params: PropTypes.object
      })
    }).isRequired
  }

  static defaultProps = {
    className: '',
    isFocused: false,
    isDisabled: false,
    danger: false
  }

  handleClick = event => {
    event.stopPropagation()
    this.props.onAction(event, this.props.item)
  }

  handleFocus = event => {
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
    return (
      <IntentLink
        onClick={this.handleClick}
        className={danger ? styles.dangerLink : styles.link}
        onFocus={this.handleFocus}
        tabIndex="0"
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
        onClick={isDisabled ? null : this.handleClick}
        className={danger ? styles.dangerLink : styles.link}
        onFocus={this.handleFocus}
        tabIndex="0"
      >
        {this.renderLinkChildren()}
      </a>
    )
  }

  render() {
    const {className, isDisabled, isFocused, item} = this.props
    const {intent} = item
    return (
      <li
        className={classNames([
          isFocused ? styles.focusedItem : styles.item,
          isDisabled && styles.isDisabled,
          className
        ])}
      >
        {intent ? this.renderIntentLink() : this.renderFunctionLink()}
      </li>
    )
  }
}

export default DefaultMenuItem
