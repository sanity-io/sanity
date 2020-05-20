import PropTypes from 'prop-types'
import React from 'react'
import {negate} from 'lodash'
import classNames from 'classnames'
import Menu from 'part:@sanity/components/menus/default'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import {IntentLink} from 'part:@sanity/base/router'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import {Tooltip} from 'react-tippy'
import Styleable from '../utilities/Styleable'
import defaultStyles from './styles/DefaultPane.css'
import S from '@sanity/base/structure-builder'

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
      isMenuOpen: false
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

  handleToggleMenu = () => {
    this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
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
    this.setState({isMenuOpen: false})
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
    const Icon = action.icon

    return (
      <div className={styles.buttonWrapper} key={getActionKey(action, i)}>
        <IntentLink
          className={styles.actionButton}
          intent={action.intent.type}
          params={action.intent.params}
          title={action.title}
        >
          <div className={styles.actionButtonInner} tabIndex={-1}>
            <Icon />
          </div>
        </IntentLink>
      </div>
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
        className={styles.initialValueTemplateDropDownItem}
        intent="create"
        params={params}
      >
        <div>
          <div>{item.title}</div>
          <div className={styles.initialValueTemplateSubtitle}>{params.type}</div>
        </div>
        <div className={styles.initialValueTemplateDropDownItemIcon}>
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
          <button
            className={styles.actionButton}
            data-menu-button-id={this.templateMenuId}
            type="button"
            title={action.title}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={this.handleMenuAction.bind(this, action)}
          >
            <div className={styles.actionButtonInner} tabIndex={-1}>
              <Icon />
            </div>
          </button>
        )}
        {action.action === 'toggleTemplateSelectionMenu' && (
          <div className={styles.initialValueTemplateDropDownMenuButton}>
            <DropDownButton
              bleed
              className={styles.initialValueTemplateDropDownMenu}
              items={items}
              renderItem={this.renderActionMenuItem}
              // eslint-disable-next-line react/jsx-no-bind
              onAction={this.handleMenuAction.bind(this, action)}
              kind="simple"
              showArrow={false}
              ripple={false}
              placement="bottom-end"
            >
              <div className={styles.buttonWrapper}>
                <div className={styles.actionButton}>
                  <div className={styles.actionButtonInner}>
                    <Icon />
                  </div>
                </div>
              </div>
            </DropDownButton>
          </div>
        )}
      </div>
    )
  }

  renderMenu() {
    const {styles, menuItems, menuItemGroups, isCollapsed} = this.props
    const items = menuItems.filter(isMenuButton)

    if (items.length === 0) {
      return null
    }

    return (
      <div className={styles.menuWrapper}>
        <Tooltip
          arrow
          theme="light"
          trigger="click focus"
          position="bottom"
          interactive
          open={this.state.isMenuOpen}
          onRequestClose={this.handleToggleMenu}
          useContext
          html={
            <div className={styles.menuInner}>
              <Menu
                id={this.paneMenuId}
                items={items}
                groups={menuItemGroups}
                origin={isCollapsed ? 'top-left' : 'top-right'}
                onAction={this.handleMenuAction}
              />
            </div>
          }
        >
          <button
            aria-label="Menu"
            aria-haspopup="menu"
            aria-expanded={this.state.isMenuOpen}
            aria-controls={this.paneMenuId}
            type="button"
            className={styles.menuOverflowButton}
            title="Show menu"
            onClick={this.handleToggleMenu}
          >
            <div className={styles.menuOverflowButtonInner} tabIndex={-1} aria-hidden="true">
              <IconMoreVert />
            </div>
          </button>
        </Tooltip>
      </div>
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
      menuItems,
      styles,
      renderActions,
      footer,
      tabIdPrefix,
      viewId
    } = this.props
    const actions = menuItems.filter(
      act => act.showAsAction && (!isCollapsed || act.showAsAction.whenCollapsed)
    )

    const mainChildren = isScrollable ? (
      <ScrollContainer className={styles.scrollContainer} tabIndex={-1}>
        {children}
      </ScrollContainer>
    ) : (
      <div className={styles.notScrollable}>{children}</div>
    )

    return (
      <div
        className={classNames([
          isCollapsed ? styles.isCollapsed : styles.root,
          isSelected ? styles.isActive : styles.isDisabled
        ])}
        onClick={this.handleRootClick}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title} onClick={this.handleTitleClick}>
              {title}
            </h2>
            <div className={styles.actions}>
              {renderActions ? renderActions(actions) : actions.map(this.renderAction)}
              {this.renderMenu()}
            </div>
          </div>
          {this.props.renderHeaderViewMenu()}
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
