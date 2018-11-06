import PropTypes from 'prop-types'
import React from 'react'
import {negate} from 'lodash'
import shallowEquals from 'shallow-equals'
import classNames from 'classnames'
import Menu from 'part:@sanity/components/menus/default'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import {IntentLink} from 'part:@sanity/base/router'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import Styleable from '../utilities/Styleable'
import defaultStyles from './styles/DefaultPane.css'

function getActionKey(action, index) {
  return (typeof action.action === 'string' ? action.action + action.title : action.title) || index
}

// This is the height of the global navigation bar
// TODO: Turn this into a prop that DefaultPane receives
const GLOBAL_NAV_BAR_HEIGHT = 49

const getScrollShadowState = (scrollTop, prevState) => {
  const {headerStyleRatio} = prevState
  const threshold = 30

  if (scrollTop < threshold) {
    // Round off the calculation to cut down rerenders that are not visible to the human eye
    // Example: 0.53 -> 0.55 or 0.91 -> 0.9
    const ratio = Math.round((scrollTop / threshold) * 20) / 20
    if (ratio === headerStyleRatio) {
      return null
    }

    return {
      headerStyleRatio: ratio,
      headerStyle: {
        boxShadow: `0 0 ${2 * ratio}px rgba(0, 0, 0, ${ratio * 0.2})`
      }
    }
  }

  if (scrollTop < 0 && headerStyleRatio !== -1) {
    return {
      headerStyleRatio: -1,
      headerStyle: {
        boxShadow: 'none'
      }
    }
  }

  if (headerStyleRatio !== 1) {
    return {
      headerStyleRatio: 1,
      headerStyle: {
        boxShadow: '0 0px 2px rgba(0, 0, 0, 0.2)'
      }
    }
  }

  return null
}

const noop = () => {
  /* intentional noop */
}

const isActionButton = item => item.showAsAction
const isMenuButton = negate(isActionButton)

// eslint-disable-next-line
class Pane extends React.Component {
  static propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isCollapsed: PropTypes.bool,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    children: PropTypes.node,
    isSelected: PropTypes.bool,
    isScrollable: PropTypes.bool,
    scrollTop: PropTypes.number,
    onAction: PropTypes.func,
    renderActions: PropTypes.func,
    menuItems: PropTypes.arrayOf(
      PropTypes.shape({
        showAsAction: PropTypes.oneOfType([
          PropTypes.bool,
          PropTypes.shape({whenCollapsed: PropTypes.bool})
        ])
      })
    ),
    menuItemGroups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string
      })
    ),
    styles: PropTypes.object // eslint-disable-line react/forbid-prop-types
  }

  static defaultProps = {
    title: 'Untitled',
    isCollapsed: false,
    isSelected: false,
    scrollTop: undefined,
    isScrollable: true,
    renderActions: undefined,
    styles: {},
    children: <div />,
    onAction: noop,
    onCollapse: noop,
    onExpand: noop,
    menuItems: [],
    menuItemGroups: []
  }

  state = {
    menuIsOpen: false,
    headerStyleRatio: -1,
    headerStyle: {
      boxShadow: 'none'
    },
    scrollTop: 0
  }

  scrollFrameId = null

  constructor(props) {
    super(props)

    // Passed to rendered <Menu>. This prevents the "click outside" functionality
    // from kicking in when pressing the toggle menu button
    this.paneMenuId = Math.random()
      .toString(36)
      .substr(2, 6)
  }

  static getDerivedStateFromProps(props, state) {
    if (typeof props.scrollTop === 'undefined') {
      return null
    }

    return getScrollShadowState(props.scrollTop, state)
  }

  componentDidMount() {
    this.scrollFrame()
  }

  componentWillUnmount() {
    if (this.closeRequest) {
      cancelAnimationFrame(this.closeRequest)
    }

    if (this.scrollFrameId) {
      cancelAnimationFrame(this.scrollFrameId)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // The pane header has a styling which gradually adds more shadow and tunes the opacity when
    // scrolling. In the case of "managed" lists (infinite scroll and such), the scroll position
    // is passed as a prop (`scrollTop`). However, passed a certain threshold we no longer need to
    // update, since the styling turns static. To prevent the prop from forcing a re-render,
    // explicitly check for a difference in the state here to short-circuit in this common scenario
    const scrollPropChanged = nextProps.scrollTop !== this.props.scrollTop
    const headerStyleChanged = nextState.headerStyleRatio !== this.state.headerStyleRatio
    if (scrollPropChanged && !headerStyleChanged) {
      return false
    }

    return (
      scrollPropChanged ||
      headerStyleChanged ||
      !shallowEquals(nextProps, this.props) ||
      !shallowEquals(nextState, this.state)
    )
  }

  scrollFrame = () => {
    const winScrollTop = (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || 0)
    const scrollTop = Math.max(winScrollTop - GLOBAL_NAV_BAR_HEIGHT, 0)

    if (this.state.scrollTop !== scrollTop) {
      const shadowState = getScrollShadowState(scrollTop, this.state)
      if (shadowState) {
        shadowState.scrollTop = scrollTop
        this.setState(shadowState)
      } else {
        this.setState({scrollTop: scrollTop})
      }
    }

    this.scrollFrameId = requestAnimationFrame(this.scrollFrame)
  }

  handleToggleCollapsed = event => {
    if (this.props.isCollapsed) {
      this.props.onExpand(this)
    } else {
      this.props.onCollapse(this)
    }
  }

  handleContentScroll = event => {
    const shadowState = getScrollShadowState(event.target.scrollTop, this.state)
    if (shadowState) {
      this.setState(shadowState)
    }
  }

  // Triggered by clicking "outside" of the menu when open, or after triggering action
  handleCloseMenu = () => {
    this.setState({menuIsOpen: false})
  }

  // Triggered by pane menu button
  handleMenuToggle = () => {
    this.setState(prev => ({menuIsOpen: !prev.menuIsOpen}))
  }

  handleMenuAction = item => {
    // When closing the menu outright, the menu button will be focused and the "enter" keypress
    // will bouble up to it and trigger a re-open of the menu. To work around this, use rAF to
    // ensure the current event is completed before closing the menu
    this.closeRequest = requestAnimationFrame(() => this.handleCloseMenu())

    if (typeof item.action === 'function') {
      item.action(item.params)
      return
    }

    this.props.onAction(item)
  }

  renderIntentAction = (action, i) => {
    const {styles} = this.props
    const Icon = action.icon

    return (
      <div className={styles.buttonWrapper} key={getActionKey(action, i)}>
        <IntentLink
          className={styles.actionButton}
          intent={action.intent.type}
          params={action.intent.params}
          title={action.title}
        >
          <Icon />
        </IntentLink>
      </div>
    )
  }

  renderAction = (action, i) => {
    if (action.intent) {
      return this.renderIntentAction(action, i)
    }

    const {styles} = this.props
    const Icon = action.icon

    return (
      <div className={styles.buttonWrapper} key={getActionKey(action, i)}>
        <button
          className={styles.actionButton}
          type="button"
          title={action.title}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={this.handleMenuAction.bind(this, action)}
        >
          <Icon />
        </button>
      </div>
    )
  }

  renderMenu() {
    const {styles, menuItems, menuItemGroups, isCollapsed} = this.props
    const {menuIsOpen} = this.state
    const items = menuItems.filter(isMenuButton)

    if (items.length === 0) {
      return null
    }

    return (
      <div className={styles.menuWrapper}>
        <button
          className={styles.menuOverflowButton}
          // Makes menu component ignore clicks on button (prevents double-toggling)
          data-menu-button-id={this.paneMenuId}
          type="button"
          onClick={this.handleMenuToggle}
          title="Show menu"
        >
          <IconMoreVert />
        </button>
        <div className={styles.menuContainer}>
          {menuIsOpen && (
            <Menu
              id={this.paneMenuId}
              items={items}
              groups={menuItemGroups}
              origin={isCollapsed ? 'top-left' : 'top-right'}
              onAction={this.handleMenuAction}
              onClose={this.handleCloseMenu}
              onClickOutside={this.handleCloseMenu}
            />
          )}
        </div>
      </div>
    )
  }

  render() {
    const {
      title,
      children,
      isSelected,
      isCollapsed,
      isScrollable,
      menuItems,
      styles,
      renderActions,
      staticContent
    } = this.props
    const headerStyle = isCollapsed ? {} : this.state.headerStyle
    const actions = menuItems.filter(
      act => act.showAsAction && (!isCollapsed || act.showAsAction.whenCollapsed)
    )

    return (
      <div
        className={classNames([
          isCollapsed ? styles.isCollapsed : styles.root,
          isSelected ? styles.isActive : styles.isDisabled
        ])}
        ref={this.setRootElement}
      >
        <div className={styles.header} style={{boxShadow: headerStyle.boxShadow}}>
          <div className={styles.headerContent}>
            <h2 className={styles.title} onClick={this.handleToggleCollapsed}>
              {title}
            </h2>
            <div className={styles.actions}>
              {renderActions ? renderActions(actions) : actions.map(this.renderAction)}
            </div>
            {this.renderMenu()}
          </div>
        </div>
        <div className={styles.main}>
          {isScrollable ? (
            <ScrollContainer className={styles.scrollContainer} onScroll={this.handleContentScroll}>
              {children}
            </ScrollContainer>
          ) : (
            <div className={styles.notScrollable}>{children}</div>
          )}
          {staticContent}
        </div>
      </div>
    )
  }
}

export default Styleable(Pane, defaultStyles)
