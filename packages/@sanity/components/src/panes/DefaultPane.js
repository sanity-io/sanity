import PropTypes from 'prop-types'
import React from 'react'
import {negate} from 'lodash'
import shallowEquals from 'shallow-equals'
import classNames from 'classnames'
import Menu from 'part:@sanity/components/menus/default'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Button from 'part:@sanity/components/buttons/default'
import IntentButton from 'part:@sanity/components/buttons/intent'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import Styleable from '../utilities/Styleable'
import defaultStyles from './styles/DefaultPane.css'

function getActionKey(action, index) {
  return (typeof action.action === 'string' ? action.action + action.title : action.title) || index
}

const getScrollShadowState = (scrollTop, prevState) => {
  const {headerStyleRatio} = prevState
  const threshold = 100

  if (scrollTop < threshold) {
    // Round of the calculation to cut down rerenders that are not visible to the human eye
    // Example: 0.53 -> 0.55 or 0.91 -> 0.9
    const ratio = Math.round((scrollTop / threshold) * 10 * 2) / 2 / 10
    if (ratio === headerStyleRatio) {
      return null
    }

    return {
      headerStyleRatio: ratio,
      headerStyle: {
        opacity: ratio + 0.5,
        boxShadow: `0 2px ${3 * ratio}px rgba(0, 0, 0, ${ratio * 0.3})`
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
        opacity: 1,
        boxShadow: '0 2px 3px rgba(0, 0, 0, 0.3)'
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
      opacity: 0,
      boxShadow: 'none'
    }
  }

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

  componentWillUnmount() {
    if (this.closeRequest) {
      cancelAnimationFrame(this.closeRequest)
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
    return (
      <IntentButton
        key={getActionKey(action, i)}
        title={action.title}
        icon={action.icon}
        color="primary"
        kind="simple"
        intent={action.intent.type}
        params={action.intent.params}
      />
    )
  }

  renderAction = (act, i) => {
    if (act.intent) {
      return this.renderIntentAction(act, i)
    }

    return (
      <Button
        key={getActionKey(act, i)}
        title={act.title}
        icon={act.icon}
        color="primary"
        kind="simple"
        onClick={this.handleMenuAction}
      />
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
        <div className={styles.menuButtonContainer}>
          <Button
            // Makes menu component ignore clicks on button (prevents double-toggling)
            data-menu-button-id={this.paneMenuId}
            kind="simple"
            icon={IconMoreVert}
            onClick={this.handleMenuToggle}
            className={styles.menuButton}
          />
        </div>
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
    const {title, children, isSelected, isCollapsed, menuItems, styles, renderActions} = this.props
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
            {renderActions ? renderActions(actions) : actions.map(this.renderAction)}
          </div>
          {this.renderMenu()}
          <div className={styles.headerBackground} style={{opacity: headerStyle.opacity}} />
        </div>
        <div className={styles.main}>
          <ScrollContainer className={styles.scrollContainer} onScroll={this.handleContentScroll}>
            {children}
          </ScrollContainer>
        </div>
      </div>
    )
  }
}

export default Styleable(Pane, defaultStyles)
