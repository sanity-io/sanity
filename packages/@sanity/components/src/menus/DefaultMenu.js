import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/menus/default-style'
import Ink from 'react-ink'
import enhanceWithClickOutside from 'react-click-outside'
import classNames from 'classnames'

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
    )
  }

  lastWindowHeight = 0
  scrollOffset = 0

  static defaultProps = {
    menuOpened: false,
    isOpen: false,
    fullWidth: false,
    icon: false,
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

  handleKeyDown = event => {
    const {items} = this.props
    const {selectedItem} = this.state
    const currentIndex = items.indexOf(selectedItem) || 0

    const isOpen = this.props.isOpen || this.props.opened // eslint-disable-line

    if (event.key == 'Escape' && isOpen) {
      this.props.onClose()
    }

    if (event.key == 'ArrowDown' && isOpen && currentIndex < items.length - 1) {
      this.setState({
        focusedItem: this.props.items[currentIndex + 1]
      })
    }

    if (event.key == 'ArrowUp' && isOpen && currentIndex > 0) {
      this.setState({
        focusedItem: this.props.items[currentIndex - 1]
      })
    }

    if (event.key == 'Enter' && isOpen && this.state.selectedItem) {
      this.props.onAction(this.props.items[currentIndex])
    }
  }

  handleItemClick = event => {
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

  setRootElement = element => {
    this._rootElement = element
  }

  render() {
    const {focusedItem} = this.state
    const {items, ripple, className, opened} = this.props

    const isOpen = opened || this.props.isOpen

    return (
      <div
        ref={this.setRootElement}
        className={`${isOpen ? styles.isOpen : styles.closed} ${className || ''}`}
      >
        <ul className={styles.list}>
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <li
                key={i}
                className={classNames([
                  item === focusedItem ? styles.focusedItem : styles.item,
                  item.isDisabled && styles.isDisabled,
                  item.divider && styles.divider,
                  item.active && styles.activeItem
                ])}
              >
                <a
                  onClick={item.isDisabled ? null : this.handleItemClick}
                  data-action-id={i}
                  className={item.danger ? styles.dangerLink : styles.link}
                  onFocus={this.handleFocus}
                  tabIndex="0"
                  onKeyPress={this.handleKeyPress}
                >
                  {Icon && (
                    <span className={styles.iconContainer}>
                      <Icon className={styles.icon} />
                    </span>
                  )}
                  {item.title}
                  {ripple && !item.isDisabled && <Ink duration={200} opacity={0.1} radius={200} />}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default enhanceWithClickOutside(DefaultMenu)
