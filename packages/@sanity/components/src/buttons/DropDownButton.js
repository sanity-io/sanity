/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import {List, Item} from 'part:@sanity/components/lists/default'
import {omit, get} from 'lodash'
import Poppable from 'part:@sanity/components/utilities/poppable'
// import ArrowKeyNavigation from 'part:@sanity/components/utilities/arrow-key-navigation'
import ArrowKeyNavigation from 'boundless-arrow-key-navigation/build'

export default class DropDownButton extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['secondary', 'add', 'delete', 'warning', 'success', 'danger', 'simple']),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func
      })
    ),
    onAction: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    inverted: PropTypes.bool,
    icon: PropTypes.func,
    loading: PropTypes.bool,
    ripple: PropTypes.bool,
    colored: PropTypes.bool,
    color: PropTypes.string,
    className: PropTypes.string,
    renderItem: PropTypes.func
  }

  static defaultProps = {
    renderItem(item) {
      return <div>{item.title}</div>
    }
  }

  firstItemElement = React.createRef()
  buttonElement = React.createRef()

  state = {
    menuOpened: false
  }
  menuHasKeyboardFocus = false
  keyboardNavigation = false

  handleClose = () => {
    this.setState({menuOpened: false})
  }

  setMenuElement = element => {
    this._menuElement = element
  }

  handleOnClick = event => {
    this.setState({
      menuOpened: true,
      width: event.target.offsetWidth
    })
    // Checks if the onClick comes from pressing the keyboard
    this.keyboardNavigation = event.detail == 0
  }

  handleButtonBlur = event => {
    if (this.state.menuOpened && !this.menuHasKeyboardFocus && this.keyboardNavigation) {
      this.handleClose()
    }
  }

  handleClickOutside = event => {
    if (this._rootElement && this._rootElement.contains(event.target)) {
      // Stop the open button from being clicked
      event.stopPropagation()
      this.handleClose()
    } else {
      this.handleClose()
    }
    this.buttonElement.current.focus()
  }

  handleItemClick = item => {
    this.handleAction(item)
  }

  handleItemKeyPress = (event, item) => {
    if (event.key === 'Enter') {
      this.handleAction(item)
    }
  }

  handleAction = item => {
    this.props.onAction(item)
    this.handleClose()
    this.keyboardNavigation = false
  }

  handleMenuBlur = event => {
    this.menuHasKeyboardFocus = false
    this.buttonElement.current.focus()
    this.handleClose()
  }

  handleButtonKeyDown = event => {
    if (event.key == 'ArrowDown' && this.state.menuOpened) {
      this.menuHasKeyboardFocus = true
      this.keyboardNavigation = true
      this.firstItemElement.current.focus()
    }
  }

  render() {
    const {items, renderItem, children, kind, className, ...rest} = omit(this.props, 'onAction')
    const {menuOpened, width} = this.state

    const modifiers = {
      preventOverflow: 'viewport',
      customStyle: {
        enabled: true,
        fn: data => {
          data.styles = {
            ...data.styles,
            minWidth: get(data, 'offsets.width' || 100)
          }
          return data
        }
      }
    }

    const target = (
      <Button
        {...rest}
        onClick={this.handleOnClick}
        kind={kind}
        onKeyDown={this.handleButtonKeyDown}
        onBlur={this.handleButtonBlur}
        ref={this.buttonElement}
      >
        <div className={styles.inner}>
          {children}
          <ArrowIcon color="inherit" className={styles.arrow} />
        </div>
      </Button>
    )

    return (
      <Poppable
        modifiers={modifiers}
        target={target}
        onEscape={this.handleClose}
        onClickOutside={this.handleClose}
        referenceClassName={styles.outer}
        positionFixed
      >
        {menuOpened && (
          <div className={styles.popper} style={{minWidth: `${width}px`}}>
            {/* component list causes error here */}
            <List className={styles.list}>
              <ArrowKeyNavigation>
                {items.map((item, i) => {
                  return (
                    <Item
                      key={i}
                      className={styles.listItem}
                      onClick={() => this.handleItemClick(item)} //eslint-disable-line react/jsx-no-bind
                      onKeyPress={event => this.handleItemKeyPress(event, item)} //eslint-disable-line react/jsx-no-bind
                      item={item}
                      tabIndex={0}
                      ref={i === 0 && this.firstItemElement}
                    >
                      {renderItem(item)}
                    </Item>
                  )
                })}
              </ArrowKeyNavigation>
            </List>
            <div tabIndex={0} onFocus={this.handleMenuBlur} />
          </div>
        )}
      </Poppable>
    )
  }
}
