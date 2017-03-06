import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/menus/default-style'
import Ink from 'react-ink'
import enhanceWithClickOutside from 'react-click-outside'

class DefaultMenu extends React.Component {
  static propTypes = {
    onAction: PropTypes.func.isRequired,
    opened: PropTypes.bool,
    origin: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    ripple: PropTypes.bool,
    fullWidth: PropTypes.bool,
    className: PropTypes.string,
    onClickOutside: PropTypes.func,
    onClose: PropTypes.func,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func
      })
    )
  }

  static defaultProps = {
    menuOpened: false,
    origin: 'top-left',
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
    this.props.onClickOutside(evt)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  handleKeyDown = event => {
    const {items} = this.props
    const {selectedItem} = this.state
    const currentIndex = items.indexOf(selectedItem) || 0

    if (event.key == 'Escape' && this.props.opened) {
      this.props.onClose()
    }

    if (event.key == 'ArrowDown' && this.props.opened && currentIndex < items.length - 1) {
      this.setState({
        focusedItem: this.props.items[currentIndex + 1]
      })
    }

    if (event.key == 'ArrowUp' && this.props.opened && currentIndex > 0) {
      this.setState({
        focusedItem: this.props.items[currentIndex - 1]
      })
    }

    if (event.key == 'Enter' && this.props.opened && this.state.selectedItem) {
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

  render() {
    const {focusedItem} = this.state
    const {items, origin, ripple, fullWidth, className} = this.props
    const originStyle = styles[`origin__${origin}`]

    return (
      <div className={`${this.props.opened ? styles.opened : styles.closed} ${originStyle} ${fullWidth && styles.fullWidth} ${className}`}>
        <ul className={styles.list}>
          {
            items.map((item, i) => {
              const Icon = item.icon
              return (
                <li
                  key={i}
                  className={`
                    ${item === focusedItem ? styles.focusedItem : styles.item}
                    ${styles.item}
                    ${item.divider && styles.divider}
                  `}
                >
                  <a
                    onClick={this.handleItemClick}
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
                      ripple && <Ink />
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
