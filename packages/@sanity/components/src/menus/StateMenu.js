import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/menus/default-style'
import Ink from 'react-ink'
import {withRouter, StateLink} from 'part:@sanity/base/router'

import enhanceWithClickOutside from 'react-click-outside'

class StateMenu extends React.Component {
  static propTypes = {
    opened: PropTypes.bool,
    origin: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    ripple: PropTypes.bool,
    fullWidth: PropTypes.bool,
    className: PropTypes.string,
    onClickOutside: PropTypes.func,
    onClose: PropTypes.func,
    router: PropTypes.shape({
      navigate: PropTypes.func
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func,
        linkState: PropTypes.object.isRequired
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
  state = {
    selectedItem: null
  }

  handleClickOutside = () => {
    this.props.onClickOutside()
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
        selectedItem: this.props.items[currentIndex + 1]
      })
    }

    if (event.key == 'ArrowUp' && this.props.opened && currentIndex > 0) {
      this.setState({
        selectedItem: this.props.items[currentIndex - 1]
      })
    }

    if (event.key == 'Enter' && this.props.opened && this.state.selectedItem) {
      const {router} = this.props // todo: this should not be here
      router.navigate(selectedItem.linkState)
    }

  }

  render() {
    const {items, origin, ripple, fullWidth, className} = this.props
    const originStyle = styles[`origin__${origin}`]

    return (
      <div className={`${this.props.opened ? styles.opened : styles.closed} ${originStyle} ${fullWidth && styles.fullWidth} ${className}`}>
        <ul className={styles.list}>
          {
            items.map((item, i) => {
              const Icon = item.icon
              return (
                <li key={i} className={`${styles.item} ${item.divider && styles.divider}`}>
                  <StateLink
                    state={item.linkState}
                    className={styles.link}
                  >
                    {
                      Icon && <span className={styles.iconContainer}><Icon className={styles.icon} /></span>
                    }
                    {item.title}
                    {
                      ripple && <Ink />
                    }
                  </StateLink>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
}

export default withRouter(enhanceWithClickOutside(StateMenu))
