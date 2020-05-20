import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import {List, Item} from 'part:@sanity/components/lists/default'
import {omit, get} from 'lodash'
import Poppable from 'part:@sanity/components/utilities/poppable'
import ArrowKeyNavigation from 'boundless-arrow-key-navigation/build'

const modifiers = {
  preventOverflow: {
    boundariesElement: 'window',
    padding: 16
  },
  customStyle: {
    enabled: true,
    fn: data => {
      data.styles = {
        ...data.styles,
        minWidth: `${get(data, 'offsets.reference.width' || 100)}px`
      }
      return data
    }
  }
}

function parentButtonIsMenuButton(node, id) {
  let el = node
  do {
    if (el.tagName === 'BUTTON' && el.dataset.menuButtonId === id) {
      return true
    }
  } while ((el = el.parentNode))

  return false
}

export default class DropDownButton extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['default', 'simple']),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func
      })
    ),
    onAction: PropTypes.func.isRequired,
    children: PropTypes.node,
    inverted: PropTypes.bool,
    icon: PropTypes.func,
    loading: PropTypes.bool,
    colored: PropTypes.bool,
    color: PropTypes.string,
    className: PropTypes.string,
    renderItem: PropTypes.func,
    placement: PropTypes.string,
    showArrow: PropTypes.bool
  }

  static defaultProps = {
    children: undefined,
    className: undefined,
    color: undefined,
    colored: false,
    kind: undefined,
    icon: undefined,
    inverted: false,
    items: [],
    loading: false,
    renderItem(item) {
      return <div>{item.title}</div>
    },
    showArrow: true,
    placement: 'bottom-start'
  }

  firstItemElement = React.createRef()
  buttonElement = React.createRef()

  state = {
    menuOpened: false
  }

  menuHasKeyboardFocus = false
  keyboardNavigation = false

  constructor(props) {
    super(props)

    this.menuId = Math.random()
      .toString(36)
      .substr(2, 6)
  }

  handleClose = evt => {
    if (evt && parentButtonIsMenuButton(evt.target, this.menuId)) {
      // Don't treat clicks on the open menu button as "outside" clicks -
      // prevents us from double-toggling a menu as open/closed
      return
    }

    this.setState({menuOpened: false})
  }

  setMenuElement = element => {
    this._menuElement = element
  }

  handleOnClick = event => {
    this.setState(({menuOpened}) => ({menuOpened: !menuOpened}))

    // Checks if the onClick comes from pressing the keyboard
    this.keyboardNavigation = event.detail == 0
  }

  handleButtonBlur = event => {
    if (this.state.menuOpened && !this.menuHasKeyboardFocus && this.keyboardNavigation) {
      this.handleClose()
    }
  }

  handleItemClick = (event, item) => {
    event.stopPropagation()
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
    const {items, renderItem, children, kind, className, placement, showArrow, ...rest} = omit(
      this.props,
      'onAction'
    )
    const {menuOpened} = this.state
    const buttonElement =
      this.buttonElement && this.buttonElement.current && this.buttonElement.current._element

    return (
      <Button
        {...rest}
        data-menu-button-id={this.menuId}
        className={styles.button}
        onClick={this.handleOnClick}
        kind={kind}
        onKeyDown={this.handleButtonKeyDown}
        onBlur={this.handleButtonBlur}
        ref={this.buttonElement}
      >
        <div className={styles.inner}>
          {showArrow ? (
            <div className={styles.inner}>
              {children}
              <ArrowIcon color="inherit" className={styles.arrow} />
            </div>
          ) : (
            children
          )}
          <Poppable
            modifiers={modifiers}
            placement={placement}
            referenceElement={buttonElement}
            onEscape={this.handleClose}
            onClickOutside={this.handleClose}
            referenceClassName={styles.outer}
            popperClassName={styles.popper}
            positionFixed
          >
            {menuOpened && (
              <Fragment>
                <List className={styles.list}>
                  <ArrowKeyNavigation>
                    {items.map((item, i) => {
                      return (
                        <Item
                          key={i}
                          className={styles.listItem}
                          onClick={event => this.handleItemClick(event, item)} //eslint-disable-line react/jsx-no-bind
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
              </Fragment>
            )}
          </Poppable>
        </div>
      </Button>
    )
  }
}
