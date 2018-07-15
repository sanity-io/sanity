/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import Menu from 'part:@sanity/components/menus/default'
import {omit, get} from 'lodash'
import Poppable from 'part:@sanity/components/utilities/poppable'

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
    className: PropTypes.string
  }

  state = {
    menuOpened: false
  }

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
    const {items, children, kind, className, ...rest} = omit(this.props, 'onAction')
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
      <Button {...rest} onClick={this.handleOnClick} kind={kind}>
        <span className={styles.title}>{children}</span>
        <span className={styles.arrow}>
          <ArrowIcon color="inherit" />
        </span>
      </Button>
    )

    return (
      <div className={`${styles.root} ${className}`}>
        <Poppable
          modifiers={modifiers}
          target={target}
          onEscape={this.handleClose}
          onClickOutside={this.handleClose}
        >
          {menuOpened && (
            <div className={styles.popper} style={{minWidth: `${width}px`}}>
              <Menu
                isOpen
                items={items}
                className={styles.menu}
                onAction={this.handleAction}
                onClickOutside={this.handleClickOutside}
              />
            </div>
          )}
        </Poppable>
      </div>
    )
  }
}
