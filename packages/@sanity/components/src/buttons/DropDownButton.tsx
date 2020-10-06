import PopperJS from '@popperjs/core'
import ArrowKeyNavigation from 'boundless-arrow-key-navigation/build'
import classNames from 'classnames'
import {omit, get} from 'lodash'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ChevronDownIcon from 'part:@sanity/base/angle-down-icon'
import {List, Item} from 'part:@sanity/components/lists/default'
import Poppable from 'part:@sanity/components/utilities/poppable'
import React from 'react'
import {ButtonColor, ButtonKind, ButtonPadding, ButtonSize} from './types'

interface DropdownItem {
  title: string
  icon?: React.ComponentType<Record<string, unknown>>
}

interface DropdownButtonProps {
  kind?: ButtonKind
  items: DropdownItem[]
  onAction: (item: DropdownItem) => void
  inverted?: boolean
  icon?: React.ComponentType<Record<string, unknown>>
  loading?: boolean
  color?: ButtonColor
  renderItem?: (item: DropdownItem) => React.ReactElement
  padding?: ButtonPadding
  placement?: PopperJS.Placement
  size?: ButtonSize
  showArrow?: boolean
}

interface DropdownButtonState {
  menuOpened: boolean
}

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

// @todo: refactor to functional component
export default class DropDownButton extends React.PureComponent<
  DropdownButtonProps & React.HTMLProps<HTMLButtonElement>,
  DropdownButtonState
> {
  // @todo: how to refer to `ButtonLike`?
  _buttonElement = React.createRef<any>()
  _firstItemElement = React.createRef<HTMLLIElement>()
  _menuElement: HTMLElement | null = null

  menuHasKeyboardFocus = false
  keyboardNavigation = false
  menuId: string | null = null

  state = {
    menuOpened: false
  }

  constructor(props) {
    super(props)

    this.menuId = Math.random()
      .toString(36)
      .substr(2, 6)
  }

  handleClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event && parentButtonIsMenuButton(event.target, this.menuId)) {
      // Don't treat clicks on the open menu button as "outside" clicks -
      // prevents us from double-toggling a menu as open/closed
      return
    }

    this.setState({menuOpened: false})
  }

  handleClickOutside = () => {
    this.handleClose()
  }

  setMenuElement = (element: HTMLElement | null) => {
    this._menuElement = element
  }

  handleOnClick = (event: React.MouseEvent<HTMLElement>) => {
    this.setState(({menuOpened}) => ({menuOpened: !menuOpened}))

    // Checks if the onClick comes from pressing the keyboard
    this.keyboardNavigation = event.detail == 0
  }

  handleButtonBlur = () => {
    if (this.state.menuOpened && !this.menuHasKeyboardFocus && this.keyboardNavigation) {
      this.handleClose()
    }
  }

  handleItemClick = (event: React.MouseEvent<HTMLElement>, item: DropdownItem) => {
    event.stopPropagation()
    this.handleAction(item)
  }

  handleItemKeyPress = (event: React.KeyboardEvent<HTMLElement>, item: DropdownItem) => {
    if (event.key === 'Enter') {
      this.handleAction(item)
    }
  }

  handleAction = (item: DropdownItem) => {
    this.props.onAction(item)
    this.handleClose()
    this.keyboardNavigation = false
  }

  handleMenuBlur = () => {
    this.menuHasKeyboardFocus = false
    if (this._buttonElement.current) this._buttonElement.current.focus()
    this.handleClose()
  }

  handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key == 'ArrowDown' && this.state.menuOpened) {
      this.menuHasKeyboardFocus = true
      this.keyboardNavigation = true
      if (this._firstItemElement.current) this._firstItemElement.current.focus()
    }
  }

  render() {
    const {
      items,
      renderItem,
      children,
      kind,
      className,
      placement = 'bottom-start',
      showArrow = true,
      ...rest
    } = omit(this.props, 'onAction')
    const {menuOpened} = this.state
    const _buttonElement =
      this._buttonElement && this._buttonElement.current && this._buttonElement.current._element

    return (
      <>
        <Button
          {...rest}
          data-menu-button-id={this.menuId}
          className={classNames(styles.button, className)}
          onClick={this.handleOnClick}
          kind={kind}
          onKeyDown={this.handleButtonKeyDown}
          onBlur={this.handleButtonBlur}
          ref={this._buttonElement as any}
        >
          {(showArrow || children) && (
            <div className={styles.inner}>
              {showArrow ? (
                <div className={styles.inner}>
                  <span className={styles.label}>{children}</span>
                  <span className={styles.iconContainer}>
                    <ChevronDownIcon />
                  </span>
                </div>
              ) : (
                children
              )}
            </div>
          )}
        </Button>

        {/* Dropdown menu */}
        {menuOpened && (
          <Poppable
            modifiers={modifiers as any}
            placement={placement}
            referenceElement={_buttonElement}
            onEscape={this.handleClose}
            onClickOutside={this.handleClickOutside}
            referenceClassName={styles.outer}
            popperClassName={styles.popper}
            positionFixed
          >
            <List className={styles.list}>
              <ArrowKeyNavigation>
                {items.map((item, i) => (
                  <Item
                    key={String(i)}
                    className={styles.listItem}
                    onClick={event => this.handleItemClick(event, item)}
                    onKeyPress={event => this.handleItemKeyPress(event, item)}
                    tabIndex={0}
                    ref={i === 0 ? this._firstItemElement : undefined}
                  >
                    {renderItem ? renderItem(item) : <div>{item.title}</div>}
                  </Item>
                ))}
              </ArrowKeyNavigation>
            </List>
            <div tabIndex={0} onFocus={this.handleMenuBlur} />
          </Poppable>
        )}
      </>
    )
  }
}
