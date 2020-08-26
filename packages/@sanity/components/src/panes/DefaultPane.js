import PropTypes from 'prop-types'
import React from 'react'
import {negate} from 'lodash'
import classNames from 'classnames'
import {MenuButton} from 'part:@sanity/components/menu-button'
import Menu from 'part:@sanity/components/menus/default'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import {IntentLink} from 'part:@sanity/base/router'
import Button from 'part:@sanity/components/buttons/default'
import IntentButton from 'part:@sanity/components/buttons/intent'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import S from '@sanity/base/structure-builder'
import Styleable from '../utilities/Styleable'

import defaultStyles from './styles/DefaultPane.css'

function getActionKey(action, index) {
  return (typeof action.action === 'string' ? action.action + action.title : action.title) || index
}

function noActionFn() {
  // eslint-disable-next-line no-console
  console.warn('No handler defined for action')
}

const noop = () => {
  /* intentional noop */
}

const isActionButton = item => item.showAsAction
const isMenuButton = negate(isActionButton)

function toChildNodeArray(nodes) {
  const arr = Array.isArray(nodes) ? nodes : [nodes]

  return arr.filter(x => x !== undefined && x !== null && x !== false)
}

class Pane extends React.PureComponent {
  static propTypes = {
    hasTabs: PropTypes.bool,
    tabIdPrefix: PropTypes.string,
    viewId: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isCollapsed: PropTypes.bool,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    children: PropTypes.node,
    isSelected: PropTypes.bool,
    isScrollable: PropTypes.bool,
    hasSiblings: PropTypes.bool,
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
    initialValueTemplates: PropTypes.arrayOf(
      PropTypes.shape({
        templateId: PropTypes.string,
        parameters: PropTypes.object // eslint-disable-line react/forbid-prop-types
      })
    ),
    index: PropTypes.number,
    footer: PropTypes.node,
    renderHeaderViewMenu: PropTypes.func,
    styles: PropTypes.object // eslint-disable-line react/forbid-prop-types
  }

  static defaultProps = {
    index: 0,
    footer: undefined,
    hasTabs: false,
    tabIdPrefix: undefined,
    viewId: undefined,
    title: 'Untitled',
    hasSiblings: false,
    isCollapsed: false,
    isSelected: false,
    isScrollable: true,
    renderActions: undefined,
    styles: {},
    children: <div />,
    onAction: noop,
    menuItems: [],
    menuItemGroups: [],
    initialValueTemplates: [],
    renderHeaderViewMenu: () => null
  }

  actionHandlers = {}

  scrollFrameId = null

  constructor(props) {
    super(props)

    this.state = {
      isMenuOpen: false,
      isInitialValueMenuOpen: false
    }

    // Passed to rendered <Menu> components. This prevents the "click outside"
    // functionality from kicking in when pressing the toggle menu button
    this.templateMenuId = Math.random()
      .toString(36)
      .substr(2, 6)

    this.paneMenuId = Math.random()
      .toString(36)
      .substr(2, 6)
  }

  // Triggered by clicking "outside" of the menu when open, or after triggering action
  handleCloseContextMenu = () => {
    this.setState({isMenuOpen: false})
  }

  // Triggered by pane menu button
  // handleToggleMenu = () => {
  //   this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
  // }

  setContextMenuOpen = val => {
    this.setState({isMenuOpen: val})
  }

  setInitialValueMenuOpen = val => {
    this.setState({isInitialValueMenuOpen: val})
    // this.setState(prevState => ({isInitialValueMenuOpen: !prevState.isInitialValueMenuOpen}))
  }

  // handleToggleInitialValueTemplateMenu = () => {
  //   this.setState(prevState => ({isInitialValueMenuOpen: !prevState.isInitialValueMenuOpen}))
  // }

  handleCloseTemplateMenu = () => {
    this.setState({isInitialValueMenuOpen: false})
  }

  handleRootClick = event => {
    const {onExpand, isCollapsed, index} = this.props
    if (isCollapsed && onExpand) {
      onExpand(index)
    }
  }

  handleTitleClick = event => {
    const {onCollapse, isCollapsed, index} = this.props
    if (!isCollapsed && onCollapse) {
      onCollapse(index)
    }
  }

  handleMenuAction = item => {
    this.setContextMenuOpen(false)

    // this.handleCloseContextMenu()
    if (typeof item.action === 'function') {
      item.action(item.params)
      return
    }
    const actionHandled = this.props.onAction(item)
    if (actionHandled) {
      return
    }

    const handler = this.actionHandlers[item.action] || noActionFn
    handler(item.params, this)
  }

  renderIntentAction = (action, i) => {
    const {styles} = this.props

    return (
      <IntentButton
        className={styles.actionButton}
        icon={action.icon}
        intent={action.intent.type}
        key={getActionKey(action, i)}
        kind="simple"
        padding="small"
        params={action.intent.params}
        title={action.title}
      />
    )
  }

  renderActionMenuItem = item => {
    const {styles} = this.props
    if (!item) {
      return null
    }
    const params = item.intent.params
    const Icon = item.icon
    return (
      <IntentLink
        className={styles.initialValueTemplateMenuItem}
        intent="create"
        onClick={this.handleCloseTemplateMenu}
        params={params}
      >
        <div>
          <div>{item.title}</div>
          <div className={styles.initialValueTemplateSubtitle}>{params.type}</div>
        </div>
        <div className={styles.initialValueTemplateMenuItemIcon}>
          <Icon />
        </div>
      </IntentLink>
    )
  }

  renderAction = (action, i) => {
    if (action.intent) {
      return this.renderIntentAction(action, i)
    }

    const {styles, initialValueTemplates} = this.props
    const items = S.menuItemsFromInitialValueTemplateItems(initialValueTemplates)
    const Icon = action.icon
    return (
      <div className={styles.menuWrapper} key={getActionKey(action, i)}>
        {action.action !== 'toggleTemplateSelectionMenu' && (
          <Button
            data-menu-button-id={this.templateMenuId}
            icon={Icon}
            kind="simple"
            padding="small"
            title={action.title}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={this.handleMenuAction.bind(this, action)}
          />
        )}

        {action.action === 'toggleTemplateSelectionMenu' && (
          <MenuButton
            buttonProps={{
              'aria-label': 'Menu',
              'aria-haspopup': 'menu',
              'aria-expanded': this.state.isInitialValueMenuOpen,
              'aria-controls': this.templateMenuId,
              icon: Icon,
              kind: 'simple',
              // onClick: this.handleToggleInitialValueTemplateMenu,
              padding: 'small',
              selected: this.state.isInitialValueMenuOpen,
              title: 'Create new document'
            }}
            menu={
              <div className={styles.initialValueTemplateMenu}>
                {items.map(item => this.renderActionMenuItem(item))}
              </div>
            }
            open={this.state.isInitialValueMenuOpen}
            placement="bottom-end"
            setOpen={this.setInitialValueMenuOpen}
          />
        )}
      </div>
    )
  }

  renderActionNodes() {
    const {isCollapsed, menuItems, renderActions} = this.props

    const actions = menuItems.filter(
      action => action.showAsAction && (!isCollapsed || action.showAsAction.whenCollapsed)
    )

    if (renderActions) {
      return renderActions(actions)
    }

    return actions.map(this.renderAction)
  }

  renderHeaderToolsOverflowMenu() {
    const {styles, menuItems, menuItemGroups, isCollapsed} = this.props
    const items = menuItems.filter(isMenuButton)
    const {isMenuOpen} = this.state
    if (items.length === 0) {
      return null
    }

    return (
      <div className={styles.headerToolContainer}>
        <MenuButton
          buttonProps={{
            'aria-label': 'Menu',
            'aria-haspopup': 'menu',
            'aria-expanded': isMenuOpen,
            'aria-controls': this.paneMenuId,
            className: styles.menuOverflowButton,
            icon: IconMoreVert,
            kind: 'simple',
            padding: 'small',
            selected: isMenuOpen,
            title: 'Show menu'
          }}
          menu={
            <Menu
              id={this.paneMenuId}
              items={items}
              groups={menuItemGroups}
              origin={isCollapsed ? 'top-left' : 'top-right'}
              onAction={this.handleMenuAction}
              onClose={this.handleCloseContextMenu}
            />
          }
          open={isMenuOpen}
          placement="bottom-end"
          setOpen={this.setContextMenuOpen}
        />
      </div>
    )
  }

  renderHeaderTools() {
    const {styles} = this.props
    const headerActionNodes = toChildNodeArray(this.renderActionNodes())

    return (
      <>
        {headerActionNodes.map((actionNode, actionNodeIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={actionNodeIndex} className={styles.headerToolContainer}>
            {actionNode}
          </div>
        ))}
        {this.renderHeaderToolsOverflowMenu()}
      </>
    )
  }

  // eslint-disable-next-line complexity
  render() {
    const {
      title,
      children,
      hasTabs,
      isSelected,
      isCollapsed,
      isScrollable,
      hasSiblings,
      styles,
      footer,
      tabIdPrefix,
      viewId
    } = this.props

    const mainChildren = isScrollable ? (
      <ScrollContainer className={styles.scrollContainer} tabIndex={-1}>
        {children}
      </ScrollContainer>
    ) : (
      <div className={styles.notScrollable}>{children}</div>
    )

    const headerViewMenuNode = this.props.renderHeaderViewMenu()

    return (
      <div
        className={classNames([
          styles.root,
          isCollapsed && styles.isCollapsed,
          isSelected ? styles.isActive : styles.isDisabled
        ])}
        onClick={this.handleRootClick}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleContainer}>
              <h2 className={styles.title} onClick={this.handleTitleClick}>
                {title}
              </h2>
            </div>
            <div className={styles.headerTools}>{this.renderHeaderTools()}</div>
          </div>

          {/* To render tabs and similar */}
          {headerViewMenuNode && <div className={styles.headerViewMenu}>{headerViewMenuNode}</div>}
        </div>

        {hasTabs ? (
          <TabPanel
            aria-labelledby={`${tabIdPrefix}tab-${viewId}`}
            className={styles.main}
            id={`${tabIdPrefix}tabpanel`}
            role="tabpanel"
          >
            {mainChildren}
          </TabPanel>
        ) : (
          <div className={styles.main}>{mainChildren}</div>
        )}

        {footer && (
          <div className={hasTabs && hasSiblings ? styles.hoverFooter : styles.stickyFooter}>
            {footer}
          </div>
        )}
      </div>
    )
  }
}

export default Styleable(Pane, defaultStyles)
