import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import Button from 'part:@sanity/components/buttons/default'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import Menu from 'part:@sanity/components/menus/default'
import {omit} from 'lodash'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import tryFindScrollContainer from '../utilities/tryFindScrollContainer'

class DropDownButton extends React.Component {
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
      tryFindScrollContainer(this._rootElement, this.setScrollContainerElement)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true
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
  }

  setMenuElement = element => {
    this._menuElement = element
  }

  handleOnClick = event => {
    this.setState({
      menuOpened: !this.state.menuOpened
    })

  }
  handleAction(item) {
    this.props.onAction(item)
  }

  handleResize = dimensions => {
    // console.log('handleResize: dimensions', dimensions)
    // console.log('menuHeight', this._menuElement.offsetHeight)
  }

  render() {
    const {items, children, kind, className, ...rest} = omit(this.props, 'onAction')
    const {menuOpened, scrollContainer} = this.state
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
          <div className={styles.menuRoot}>
            {
              menuOpened && (
                <StickyPortal
                  isOpen={menuOpened}
                  scrollContainer={scrollContainer}
                  onlyBottomSpace={false}
                  useOverlay={false}
                  onResize={this.handleResize}
                >
                  <div ref={this.setMenuElement}>
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
      </div>
    )
  }
}

export default DropDownButton
