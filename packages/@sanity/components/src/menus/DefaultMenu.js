import PropTypes from 'prop-types'
import React from 'react'
import {IntentLink, withRouterHOC} from 'part:@sanity/base/router'
import styles from 'part:@sanity/components/menus/default-style'
import Ink from 'react-ink'
import enhanceWithClickOutside from 'react-click-outside'
import classNames from 'classnames'

function parentButtonIsMenuButton(node) {
  let el = node
  do {
    if (el.tagName === 'BUTTON' && el.dataset.isMenuButton) {
      return true
    }
  } while ((el = el.parentNode))

  return false
}

class DefaultMenu extends React.Component {
  static propTypes = {
    onAction: PropTypes.func.isRequired,
    isOpen: PropTypes.bool,
    ripple: PropTypes.bool,
    className: PropTypes.string,
    onClickOutside: PropTypes.func,
    onClose: PropTypes.func,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.node.isRequired,
        icon: PropTypes.func
      })
    ),
    router: PropTypes.shape({
      navigateIntent: PropTypes.func.isRequired
    }).isRequired
  }

  static defaultProps = {
    items: [],
    isOpen: false,
    ripple: true,
    onClickOutside() {},
    onClose() {}
  }

  constructor(props) {
    super(props)

    this.state = {
      focusedItem: null
    }
  }

  handleClickOutside = event => {
    if (parentButtonIsMenuButton(event.target)) {
      // Don't treat clicks on the open menu button as "outside" clicks -
      // prevents us from double-toggling a menu as open/closed
      return
    }

    if (this.props.isOpen) {
      this.props.onClickOutside(event)
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
    window.addEventListener('resize', this.handleResize, false)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize, false)
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  // eslint-disable-next-line complexity
  handleKeyDown = event => {
    const {isOpen, router} = this.props
    if (!isOpen) {
      return
    }

    const {focusedItem} = this.state
    const items = this.props.items.filter(item => !item.isDisabled)
    const currentIndex = items.indexOf(focusedItem) || 0

    if (event.key === 'Escape') {
      this.props.onClose(event)
    }

    if (event.key === 'ArrowDown') {
      this.setState({
        focusedItem: items[currentIndex < items.length - 1 ? currentIndex + 1 : 0]
      })
    }

    if (event.key === 'ArrowUp') {
      this.setState({
        focusedItem: items[currentIndex > 0 ? currentIndex - 1 : items.length - 1]
      })
    }

    if (event.key === 'Enter' && focusedItem) {
      if (focusedItem.intent) {
        router.navigateIntent(focusedItem.intent.type, focusedItem.intent.params)
      } else {
        event.stopPropagation()
        this.props.onAction(items[currentIndex])
      }
    }
  }

  handleItemClick = event => {
    event.stopPropagation()
    const actionId = event.currentTarget.getAttribute('data-action-id')
    this.props.onAction(this.props.items[actionId])
  }

  handleFocus = event => {
    const index = event.target.getAttribute('data-action-id')
    this.setState({
      focusedItem: this.props.items[index]
    })
  }

  handleKeyPress = event => {
    const index = event.target.getAttribute('data-action-id')
    if (event.key === 'Enter') {
      this.props.onAction(this.props.items[index])
    }
  }

  renderLinkChildren = item => {
    const Icon = item.icon
    return (
      <React.Fragment>
        {Icon && (
          <span className={styles.iconContainer}>
            <Icon className={styles.icon} />
          </span>
        )}
        {item.title}
        {this.props.ripple && !item.isDisabled && <Ink duration={200} opacity={0.1} radius={200} />}
      </React.Fragment>
    )
  }

  renderIntentLink = (item, index) => (
    <IntentLink
      onClick={this.props.onClose}
      data-action-id={index}
      className={item.danger ? styles.dangerLink : styles.link}
      onFocus={this.handleFocus}
      tabIndex="0"
      onKeyPress={this.handleKeyDown}
      intent={item.intent.type}
      params={item.intent.params}
    >
      {this.renderLinkChildren(item)}
    </IntentLink>
  )

  renderFunctionLink = (item, index) => (
    <a
      onClick={item.isDisabled ? null : this.handleItemClick}
      data-action-id={index}
      className={item.danger ? styles.dangerLink : styles.link}
      onFocus={this.handleFocus}
      tabIndex="0"
    >
      {this.renderLinkChildren(item)}
    </a>
  )

  render() {
    const {focusedItem} = this.state
    const {items, className, isOpen} = this.props

    return (
      <div className={classNames([isOpen ? styles.isOpen : styles.closed, className])}>
        <ul className={styles.list}>
          {items.map((item, index) => {
            return (
              <li
                key={index}
                className={classNames([
                  item === focusedItem ? styles.focusedItem : styles.item,
                  item.isDisabled && styles.isDisabled,
                  item.divider && styles.divider
                ])}
              >
                {item.intent
                  ? this.renderIntentLink(item, index)
                  : this.renderFunctionLink(item, index)}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default enhanceWithClickOutside(withRouterHOC(DefaultMenu))
