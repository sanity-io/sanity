import {StructureBuilder as S} from '@sanity/structure'
import {InitialValueTemplateItem} from '@sanity/structure/lib/InitialValueTemplateItem'
import {Layer} from '@sanity/ui'
import classNames from 'classnames'
import {negate} from 'lodash'
import {MenuButton} from 'part:@sanity/components/menu-button'
import Menu from 'part:@sanity/components/menus/default'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import {IntentLink} from 'part:@sanity/base/router'
import Button from 'part:@sanity/components/buttons/default'
import IntentButton from 'part:@sanity/components/buttons/intent'
import {ScrollContainer} from 'part:@sanity/components/scroll'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import React from 'react'
import {childrenToElementArray} from '../../helpers'
import {MenuItem, MenuItemGroup} from '../../menus/types'
import Styleable from '../../utilities/Styleable'

import defaultStyles from './DefaultPane.css'
import {DefaultPaneHeader} from './DefaultPaneHeader'
import {DefaultPaneFooter} from './DefaultPaneFooter'

interface DefaultPaneProps {
  color?: 'success' | 'warning' | 'danger'
  hasTabs?: boolean
  tabIdPrefix?: string
  viewId?: string
  title?: React.ReactNode
  isCollapsed?: boolean
  onExpand?: (index: number) => void
  onCollapse?: (index: number) => void
  children?: React.ReactNode
  isLoading?: boolean
  isSelected?: boolean
  isScrollable?: boolean
  hasSiblings?: boolean
  onAction?: (item: MenuItem) => boolean
  renderActions?: (actions: MenuItem[]) => React.ReactNode
  menuItems?: MenuItem[]
  menuItemGroups?: MenuItemGroup[]
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

function getActionKey(action: MenuItem, index: number) {
  const title = String(action.title)

  return (typeof action.action === 'string' ? action.action + title : title) || index
}

function noActionFn() {
  // eslint-disable-next-line no-console
  console.warn('No handler defined for action')
}

const noop = () => {
  /* intentional noop */
}

const isActionButton = (item: MenuItem) => Boolean(item.showAsAction)
const isMenuButton = negate(isActionButton)

class DefaultPane extends React.PureComponent<DefaultPaneProps, State> {
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
    renderHeaderViewMenu: () => null,
  }

  actionHandlers = {}

  rootElement: HTMLDivElement | null = null

  templateMenuId: string
  paneMenuId: string

  constructor(props: DefaultPaneProps) {
    super(props)

    this.state = {
      isMenuOpen: false,
      isInitialValueMenuOpen: false,
    }

    // Passed to rendered <Menu> components. This prevents the "click outside"
    // functionality from kicking in when pressing the toggle menu button
    this.templateMenuId = Math.random().toString(36).substr(2, 6)

    this.paneMenuId = Math.random().toString(36).substr(2, 6)
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

  handleMenuAction = (item: MenuItem) => {
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

  renderIntentAction = (action: MenuItem, i: number): React.ReactElement => {
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
        title={typeof action.title === 'string' ? action.title : undefined}
      />
    )
  }

  renderActionMenuItem = (item: MenuItem, index: number) => {
    if (!item) return null

    const {styles = {}} = this.props
    const params = item.intent && item.intent.params
    const Icon = item.icon

    return (
      <IntentLink
        className={styles.initialValueTemplateMenuItem}
        intent="create"
        key={item.key || index}
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

  renderAction = (action: MenuItem, i: number): React.ReactNode => {
    if (action.intent) {
      return this.renderIntentAction(action, i)
    }

    const styles = this.props.styles || {}

    // @todo: typings
    const items: MenuItem[] = this.props.initialValueTemplates
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
            title={typeof action.title === 'string' ? action.title : undefined}
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
              title: 'Create new document',
            }}
            menu={
              <div className={styles.initialValueTemplateMenu}>
                {items.map((item, index) => this.renderActionMenuItem(item, index))}
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
      (action) =>
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
            title: 'Show menu',
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
      color,
      title,
      children,
      hasTabs,
      isCollapsed,
      isLoading,
      isScrollable,
      isSelected,
      hasSiblings,
      styles = {},
      footer,
      tabIdPrefix,
      viewId,
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
        data-pane-color={color}
        data-pane-loading={isLoading}
        onClick={this.handleRootClick}
        ref={this.setRootElement}
      >
        <DefaultPaneHeader
          onTitleClick={this.handleTitleClick}
          styles={styles}
          title={title}
          tools={this.renderHeaderTools()}
          viewMenu={headerViewMenuNode}
        />

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
          <DefaultPaneFooter
            className={hasTabs && hasSiblings ? styles.hoverFooter : styles.stickyFooter}
          >
            {footer}
          </DefaultPaneFooter>
        )}
      </div>
    )
  }
}

export default Styleable(DefaultPane as any, defaultStyles) as React.ComponentType<DefaultPaneProps>
