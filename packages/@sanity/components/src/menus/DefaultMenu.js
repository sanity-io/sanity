import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/menus/default-style'
import Ink from 'react-ink'
import enhanceWithClickOutside from 'react-click-outside'
import classNames from 'classnames'

// Debounce function on requestAnimationFrame
function debounceRAF(fn) {
  let scheduled
  return function debounced(...args) {
    if (!scheduled) {
      requestAnimationFrame(() => {
        fn.call(this, ...scheduled)
        scheduled = null
      })
    }
    scheduled = args
  }
}

class DefaultMenu extends React.Component {
  static propTypes = {
    onAction: PropTypes.func.isRequired,
    isOpen: PropTypes.bool,
    origin: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    ripple: PropTypes.bool,
    fullWidth: PropTypes.bool,
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

  static defaultProps = {
    menuOpened: false,
    origin: 'top-left',
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

  handleClickOutside = evt => {
    if (this.props.isOpen) {
      this.props.onClickOutside(evt)
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
    window.addEventListener('resize', this.handleResize, false)
    this.constrainHeight(this._rootElement)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize, false)
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  componentDidUpdate() {
    this.constrainHeight(this._rootElement)
  }

  handleResize = debounceRAF(() => {
    this.constrainHeight(this._rootElement)
  })

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

  constrainHeight = element => {
    const margin = 10
    if (element) {
      const clientRects = element.getBoundingClientRect()

      // Change maxheight if window resizes
      if (element.style.maxHeight) {
        const diff = this.lastWindowHeight - window.innerHeight
        element.style.maxHeight = `${element.style.maxHeight.split('px')[0] - diff}px`
      }

      // Set initial maxHeight
      if ((clientRects.top + clientRects.height) > (window.innerHeight - margin)) {
        const newMaxHeight = window.innerHeight - clientRects.top - margin
        element.style.maxHeight = `${newMaxHeight}px`
      }

      this.lastWindowHeight = window.innerHeight
    }
  }

  setRootElement = element => {
    this._rootElement = element
    this.constrainHeight(this._rootElement)
  }

  render() {
    const {focusedItem} = this.state
    const {items, origin, ripple, fullWidth, className, opened} = this.props
    const originStyle = styles[`origin__${origin}`] ? styles[`origin__${origin}`] : ''

    const isOpen = opened || this.props.isOpen

    return (
      <div
        ref={this.setRootElement}
        className={`
          ${isOpen ? styles.isOpen : styles.closed}
          ${originStyle}
          ${fullWidth && styles.fullWidth ? styles.fullWidth : ''}
          ${className || ''}
        `}
      >
        <ul className={styles.list}>
          {
            items.map((item, i) => {
              const Icon = item.icon
              return (
                <li
                  key={i}
                  className={classNames([
                    item === focusedItem ? styles.focusedItem : styles.item,
                    item.isDisabled && styles.isDisabled,
                    item.divider && styles.divider
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
                    {
                      Icon && <span className={styles.iconContainer}><Icon className={styles.icon} /></span>
                    }
                    {item.title}
                    {
                      ripple && !item.isDisabled && <Ink />
                    }
                  </a>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
}

export default enhanceWithClickOutside(DefaultMenu)
