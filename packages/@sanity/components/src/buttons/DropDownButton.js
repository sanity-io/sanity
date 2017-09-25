import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import Menu from 'part:@sanity/components/menus/default'
import {omit} from 'lodash'
import StickyPortal from 'part:@sanity/components/portal/sticky'

class DropDownButton extends React.Component {
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

  constructor(props, context) {
    super(props, context)
    this.state = {
      menuOpened: false
    }
    this.handleOnClick = this.handleOnClick.bind(this)
    this.handleAction = this.handleAction.bind(this)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true
  }

  handleClickOutside = () => {
    this.setState({menuOpened: false})
  }

  handleClose = () => {
    this.setState({menuOpened: false})
  }

  handleOnClick() {
    this.setState({
      menuOpened: !this.state.menuOpened
    })
  }
  handleAction(item) {
    this.props.onAction(item)
  }

  render() {
    const {items, children, kind, className, ...rest} = omit(this.props, 'onAction')
    return (
      <Button
        {...rest}
        className={`
          ${styles.root}
          ${className || ''}
        `}
        onClick={this.handleOnClick}
        kind={kind}
      >
        <span className={styles.title}>
          {children}
        </span>

        <span className={styles.arrow}>
          <ArrowIcon color="inherit" />
        </span>
        <div className={styles.menuRoot}>
          {
            this.state.menuOpened && (
              <StickyPortal isOpen={this.state.menuOpened} onlyBottomSpace={false}>
                <div style={{position: 'relative'}}>
                  <Menu
                    items={items}
                    isOpen
                    className={styles.menu}
                    onAction={this.handleAction}
                    onClickOutside={this.handleClickOutside}
                    onClose={this.handleClose}
                  />
                </div>
              </StickyPortal>
            )
          }
        </div>
      </Button>
    )
  }
}

export default DropDownButton
