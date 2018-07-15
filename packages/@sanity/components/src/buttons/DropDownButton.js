/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import Menu from 'part:@sanity/components/menus/default'
import {omit, uniqueId} from 'lodash'
import {Manager, Target, Popper} from 'react-popper'
import {Portal} from '../utilities/Portal'
import Stacked from '../utilities/Stacked'
import Escapable from '../utilities/Escapable'

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
    origin: PropTypes.oneOf(['left', 'right'])
  }

  static defaultProps = {
    origin: 'left'
  }

  state = {
    menuOpened: false,
    width: 100
  }

  menuId = uniqueId('menu_')

  handleClose = () => {
    this.setState({menuOpened: false})
  }

  setRootElement = element => {
    this._rootElement = element
    if (element) {
      this.width = element.offsetWidth
    }
  }

  setMenuElement = element => {
    this._menuElement = element
  }

  handleOnClick = event => {
    this.setState({
      menuOpened: true,
      width: event.target.offsetWidth
    })
  }

  handleClickOutside = event => {
    if (this._rootElement && this._rootElement.contains(event.target)) {
      // Stop the open button from being clicked
      event.stopPropagation()
      this.handleClose()
    } else {
      this.handleClose()
    }
  }

  handleAction = item => {
    this.props.onAction(item)
    this.handleClose()
  }

  render() {
    const {items, children, kind, className, origin, ...rest} = omit(this.props, 'onAction')
    const {menuOpened, width} = this.state

    return (
      <div ref={this.setRootElement} className={`${styles.root} ${className}`}>
        <Manager>
          <Target>
            <Button
              {...rest}
              onClick={this.handleOnClick}
              kind={kind}
              data-menu-button-id={this.menuId}
            >
              <span className={styles.title}>{children}</span>
              <span className={styles.arrow}>
                <ArrowIcon color="inherit" />
              </span>
            </Button>
          </Target>
          {menuOpened && (
            <Portal>
              <Stacked>
                {isActive => (
                  <Popper className={styles.popper}>
                    <div
                      className={styles.wrapper}
                      ref={this.setMenuElement}
                      style={{minWidth: `${width}px`}}
                    >
                      <Escapable onEscape={isActive && this.handleClose} />
                      <Menu
                        id={this.menuId}
                        items={items}
                        isOpen
                        className={styles.menu}
                        onAction={this.handleAction}
                        onClickOutside={isActive && this.handleClickOutside}
                      />
                    </div>
                  </Popper>
                )}
              </Stacked>
            </Portal>
          )}
        </Manager>
      </div>
    )
  }
}
