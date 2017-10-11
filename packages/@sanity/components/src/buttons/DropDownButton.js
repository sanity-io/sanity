import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import Menu from 'part:@sanity/components/menus/default'
import {omit} from 'lodash'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import tryFindScrollContainer from '../utilities/tryFindScrollContainer'

class DropDownButton extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['secondary', 'add', 'delete', 'warning', 'success', 'danger', 'simple']),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func
      })
    ),
    scrollContainer: PropTypes.element,
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
    stickToBottom: true
  }

  width = 100

  componentDidMount() {
    const {
      scrollContainer
    } = this.props

    if (!this._rootElement) {
      // console.error('no root element')
    }

    if (scrollContainer) {
      this.setScrollContainerElement(scrollContainer)
    } else {
      this.setScrollContainerElement(tryFindScrollContainer(this._rootElement))
    }
  }

  setScrollContainerElement = element => {
    this.setState({
      scrollContainer: element
    })
  }

  handleClickOutside = event => {
    this.setState({menuOpened: false})
    event.stopPropagation()
  }

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
      menuOpened: !this.state.menuOpened,
      width: event.target.offsetWidth
    })
  }

  handleAction = item => {
    this.props.onAction(item)
    this.handleClose()
  }

  handleResize = dimensions => {
    if (this._menuElement.offsetHeight < (window.innerHeight - dimensions.rootTop)) {
      this.setState({
        stickToBottom: true
      })
      return
    }
    this.setState({
      stickToBottom: false
    })
  }

  render() {
    const {items, children, kind, className, origin, ...rest} = omit(this.props, 'onAction')
    const {menuOpened, scrollContainer, width, stickToBottom} = this.state


    let menuClassName = styles.menu

    if (stickToBottom && origin === 'right') {
      menuClassName = styles.menuBottomRight
    }

    if (!stickToBottom && origin === 'right') {
      menuClassName = styles.menuTopRight
    }

    if (stickToBottom && origin === 'left') {
      menuClassName = styles.menuBottomLeft
    }

    if (!stickToBottom && origin === 'left') {
      menuClassName = styles.menuTopLeft
    }

    return (
      <div ref={this.setRootElement} className={className}>
        <Button
          {...rest}
          className={`${styles.root}`}
          onClick={this.handleOnClick}
          kind={kind}
        >
          <span className={styles.title}>
            {children}
          </span>

          <span className={styles.arrow}>
            <ArrowIcon color="inherit" />
          </span>
          <span
            className={`
              ${stickToBottom ? styles.stickyBottom : styles.stickyTop}
              ${origin === 'left' ? styles.stickyLeft : styles.stickyRight}
            `}
          >
            {
              menuOpened && (
                <StickyPortal
                  isOpen
                  scrollContainer={scrollContainer}
                  onResize={this.handleResize}
                  onlyBottomSpace={false}
                  useOverlay={false}
                  addPadding={false}
                  scrollIntoView={false}
                >
                  <div
                    ref={this.setMenuElement}
                    style={{minWidth: `${width}px`}}
                  >
                    <Menu
                      items={items}
                      isOpen
                      className={menuClassName}
                      onAction={this.handleAction}
                      onClickOutside={this.handleClickOutside}
                      onClose={this.handleClose}
                    />
                  </div>
                </StickyPortal>
              )
            }
          </span>
        </Button>
      </div>
    )
  }
}

export default DropDownButton
