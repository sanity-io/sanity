import React from 'react'
import PropTypes from 'prop-types'
import DefaultPane from 'part:@sanity/components/panes/default'
import userComponentPaneStyles from './styles/UserComponentPane.css'

function noActionFn() {
  // eslint-disable-next-line no-console
  console.warn('No handler defined for action')
}

export default class UserComponentPane extends React.PureComponent {
  static propTypes = {
    styles: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    title: PropTypes.string,
    index: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    component: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    isSelected: PropTypes.bool.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    renderActions: PropTypes.func,
    menuItems: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired
      })
    ),
    menuItemGroups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired
      })
    )
  }

  static defaultProps = {
    title: '',
    menuItems: [],
    menuItemGroups: [],
    styles: undefined,
    onExpand: undefined,
    onCollapse: undefined,
    renderActions: undefined
  }

  constructor(props) {
    super(props)

    this.userComponent = React.createRef()
  }

  handleAction = item => {
    let handler
    if (typeof item.action === 'function') {
      handler = item.action
    } else {
      handler =
        this.userComponent &&
        this.userComponent.current &&
        this.userComponent.current.actionHandlers &&
        this.userComponent.current.actionHandlers[item.action]
    }

    if (handler) {
      handler(item.params, this)
    } else {
      noActionFn()
    }
  }

  render() {
    const {
      isSelected,
      isCollapsed,
      onCollapse,
      onExpand,
      component,
      index,
      styles,
      title,
      type,
      menuItems,
      menuItemGroups,
      renderActions,
      ...rest
    } = this.props

    const hideHeader = !title && !menuItems.length && !renderActions
    const paneStyles = hideHeader ? {header: userComponentPaneStyles.noHeader} : {}
    const UserComponent = typeof component === 'function' && component

    return (
      <DefaultPane
        styles={paneStyles}
        title={title}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
        isSelected={isSelected}
        isCollapsed={isCollapsed}
        onCollapse={onCollapse}
        onExpand={onExpand}
        onAction={this.handleAction}
      >
        {UserComponent ? <UserComponent ref={this.userComponent} {...rest} /> : component}
      </DefaultPane>
    )
  }
}
