import S, {InitialValueTemplateItem} from '@sanity/base/structure-builder'
import classNames from 'classnames'
import {negate} from 'lodash'
import {MenuButton} from 'part:@sanity/components/menu-button'
import Menu, {MenuItemType, MenuItemGroupType} from 'part:@sanity/components/menus/default'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import {IntentLink} from 'part:@sanity/base/router'
import Button from 'part:@sanity/components/buttons/default'
import IntentButton from 'part:@sanity/components/buttons/intent'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import React from 'react'
import {childrenToElementArray} from '../helpers'
import Styleable from '../utilities/Styleable'

import defaultStyles from './DefaultPane.css'

interface DefaultPaneProps {
  hasTabs?: boolean
  tabIdPrefix?: string
  viewId?: string
  title?: React.ReactNode
  isCollapsed?: boolean
  onExpand?: (index: number) => void
  onCollapse?: (index: number) => void
  children?: React.ReactNode
  isSelected?: boolean
  isScrollable?: boolean
  hasSiblings?: boolean
  onAction?: (item: MenuItemType) => boolean
  renderActions?: (actions: MenuItemType[]) => React.ReactNode
  menuItems?: MenuItemType[]
  menuItemGroups?: MenuItemGroupType[]
  initialValueTemplates?: InitialValueTemplateItem[]
  index: number
  footer?: React.ReactNode
  renderHeaderViewMenu?: () => React.ReactNode
  styles?: Record<string, string>
}

interface State {
  isInitialValueMenuOpen: boolean
  isMenuOpen: boolean
}

function getActionKey(action: MenuItemType, index: number) {
  return (typeof action.action === 'string' ? action.action + action.title : action.title) || index
}

function noActionFn() {
  // eslint-disable-next-line no-console
  console.warn('No handler defined for action')
}

const noop = () => {
  /* intentional noop */
}

const isActionButton = (item: MenuItemType) => Boolean(item.showAsAction)
const isMenuButton = negate(isActionButton)

class Pane extends React.PureComponent<DefaultPaneProps, State> {
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

  rootElement: HTMLDivElement | null = null

  templateMenuId: string
  paneMenuId: string

  constructor(props: DefaultPaneProps) {
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

  setContextMenuOpen = (val: boolean) => {
    this.setState({isMenuOpen: val})
  }

  setInitialValueMenuOpen = (val: boolean) => {
    this.setState({isInitialValueMenuOpen: val})
  }

  handleCloseTemplateMenu = () => {
    this.setState({isInitialValueMenuOpen: false})
  }

  handleRootClick = () => {
    const {onExpand, isCollapsed, index} = this.props

    if (isCollapsed && onExpand) {
      onExpand(index)
    }
  }

  handleTitleClick = () => {
    const {onCollapse, isCollapsed, index} = this.props
    if (!isCollapsed && onCollapse) {
      onCollapse(index)
    }
  }

  handleMenuAction = (item: MenuItemType) => {
    this.setContextMenuOpen(false)

    if (typeof item.action === 'function') {
      item.action(item.params)
      return
    }

    const {onAction} = this.props

    const actionHandled = onAction && onAction(item)

    if (actionHandled) {
      return
    }

    const handler =
      (typeof item.action === 'string' && this.actionHandlers[item.action]) || noActionFn

    handler(item.params, this)
  }

  renderIntentAction = (action: MenuItemType, i: number): React.ReactElement => {
    const {styles = {}} = this.props

    return (
      <IntentButton
        className={styles.actionButton}
        icon={action.icon}
        intent={action.intent && action.intent.type}
        key={getActionKey(action, i)}
        kind="simple"
        padding="small"
        params={action.intent && action.intent.params}
        title={action.title}
      />
    )
  }

  renderActionMenuItem = (item: MenuItemType) => {
    if (!item) return null

    const {styles = {}} = this.props
    const params = item.intent && item.intent.params
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
          {typeof params === 'object' && (
            // @todo: typings
            <div className={styles.initialValueTemplateSubtitle}>{(params as any).type}</div>
          )}
        </div>
        {Icon && (
          <div className={styles.initialValueTemplateMenuItemIcon}>
            <Icon />
          </div>
        )}
      </IntentLink>
    )
  }

  renderAction = (action: MenuItemType, i: number): React.ReactNode => {
    if (action.intent) {
      return this.renderIntentAction(action, i)
    }

    const styles = this.props.styles || {}

    // @todo: typings
    const items: MenuItemType[] = this.props.initialValueTemplates
      ? (S.menuItemsFromInitialValueTemplateItems(this.props.initialValueTemplates) as any)
      : []

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
            onClick={this.handleMenuAction.bind(this, action)}
          />
        )}

        {action.action === 'toggleTemplateSelectionMenu' && (
          <MenuButton
            boundaryElement={this.rootElement}
            buttonProps={{
              'aria-label': 'Menu',
              'aria-haspopup': 'menu',
              'aria-expanded': this.state.isInitialValueMenuOpen,
              'aria-controls': this.templateMenuId,
              icon: Icon,
              kind: 'simple',
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
            placement="bottom"
            setOpen={this.setInitialValueMenuOpen}
          />
        )}
      </div>
    )
  }

  renderActionNodes() {
    const {isCollapsed, menuItems = [], renderActions} = this.props

    const actions = menuItems.filter(
      action =>
        action.showAsAction &&
        (!isCollapsed ||
          (typeof action.showAsAction === 'object' && action.showAsAction.whenCollapsed))
    )

    if (renderActions) {
      return renderActions(actions)
    }

    return actions.map(this.renderAction)
  }

  renderHeaderToolsOverflowMenu() {
    const {styles = {}, menuItems = [], menuItemGroups} = this.props
    const items = menuItems.filter(isMenuButton)
    const {isMenuOpen} = this.state

    if (items.length === 0) {
      return null
    }

    return (
      <div className={styles.headerToolContainer}>
        <MenuButton
          boundaryElement={this.rootElement}
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
              onAction={this.handleMenuAction}
              onClose={this.handleCloseContextMenu}
            />
          }
          open={isMenuOpen}
          placement="bottom"
          setOpen={this.setContextMenuOpen}
        />
      </div>
    )
  }

  renderHeaderTools() {
    const {styles = {}} = this.props
    const headerActionNodes = childrenToElementArray(this.renderActionNodes())

    return (
      <>
        {headerActionNodes.map((actionNode, actionNodeIndex) => (
          <div key={actionNodeIndex} className={styles.headerToolContainer}>
            {actionNode}
          </div>
        ))}
        {this.renderHeaderToolsOverflowMenu()}
      </>
    )
  }

  setRootElement = (el: HTMLDivElement | null) => {
    this.rootElement = el
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
      styles = {},
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

    const headerViewMenuNode = this.props.renderHeaderViewMenu && this.props.renderHeaderViewMenu()

    return (
      <div
        className={classNames(
          styles.root,
          isCollapsed && styles.isCollapsed,
          isSelected ? styles.isActive : styles.isDisabled
        )}
        onClick={this.handleRootClick}
        ref={this.setRootElement}
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

export default Styleable(Pane as any, defaultStyles) as React.ComponentType<DefaultPaneProps>
