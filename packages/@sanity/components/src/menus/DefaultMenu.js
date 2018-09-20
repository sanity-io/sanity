import PropTypes from 'prop-types'
import React from 'react'
import {groupBy, flatten} from 'lodash'
import {withRouterHOC} from 'part:@sanity/base/router'
import styles from 'part:@sanity/components/menus/default-style'
import enhanceWithClickOutside from 'react-click-outside'
import classNames from 'classnames'
import MenuItem from './DefaultMenuItem'

const ungrouped = Symbol('__ungrouped__')

function parentButtonIsMenuButton(node, id) {
  let el = node
  do {
    if (el.tagName === 'BUTTON' && el.dataset.menuButtonId === id) {
      return true
    }
  } while ((el = el.parentNode))

  return false
}

class DefaultMenu extends React.Component {
  static propTypes = {
    id: PropTypes.string,
    onAction: PropTypes.func.isRequired,
    ripple: PropTypes.bool,
    className: PropTypes.string,
    onClickOutside: PropTypes.func,
    onClose: PropTypes.func,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.node.isRequired,
        icon: PropTypes.func,
        intent: PropTypes.shape({
          type: PropTypes.string.isRequired,
          params: PropTypes.object
        })
      })
    ),
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string
      })
    ),
    router: PropTypes.shape({
      navigateIntent: PropTypes.func.isRequired
    }).isRequired
  }

  static defaultProps = {
    id: undefined,
    className: '',
    items: [],
    groups: [],
    ripple: true,
    onClickOutside() {},
    onClose() {}
  }

  static getDerivedStateFromProps(props) {
    const groups = props.items.reduce((acc, item) => {
      if (!item.group) {
        return acc
      }

      return acc.includes(item.group) ? acc : acc.concat(item.group)
    }, (props.groups || []).map(group => group.id))

    const byGroup = groupBy(props.items, item => item.group || ungrouped)
    const hasUngrouped = typeof byGroup[ungrouped] !== 'undefined'
    const targets = hasUngrouped ? [ungrouped].concat(groups) : groups
    const items = flatten(targets.map(group => byGroup[group] || []))
    return {items}
  }

  constructor(props) {
    super(props)

    this.state = {
      focusedItem: null
    }
  }

  handleClickOutside = event => {
    const {id, onClickOutside} = this.props
    if (id && parentButtonIsMenuButton(event.target, id)) {
      // Don't treat clicks on the open menu button as "outside" clicks -
      // prevents us from double-toggling a menu as open/closed
      return
    }

    onClickOutside(event)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
    window.addEventListener('resize', this.handleResize, false)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize, false)
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  // eslint-disable-next-line complexity
  handleKeyDown = event => {
    const {router} = this.props
    const {focusedItem} = this.state
    const items = this.state.items.filter(item => !item.isDisabled)
    const currentIndex = items.indexOf(focusedItem) || 0

    if (event.key === 'Escape') {
      this.props.onClose(event)
    }

    if (event.key === 'ArrowDown') {
      this.setState({
        focusedItem: items[currentIndex < items.length - 1 ? currentIndex + 1 : 0]
      })
    }

    if (event.key === 'ArrowUp') {
      this.setState({
        focusedItem: items[currentIndex > 0 ? currentIndex - 1 : items.length - 1]
      })
    }

    if (event.key === 'Enter' && focusedItem) {
      if (focusedItem.intent) {
        router.navigateIntent(focusedItem.intent.type, focusedItem.intent.params)
      } else {
        this.handleAction(event, focusedItem)
      }
    }
  }

  handleAction = (event, item) => {
    event.stopPropagation()
    if (item.intent) {
      this.props.onClose()
    } else {
      this.props.onAction(item)
    }
  }

  handleFocus = (event, focusedItem) => {
    this.setState({focusedItem})
  }

  handleKeyPress = event => {
    const index = event.target.getAttribute('data-action-id')
    if (event.key === 'Enter') {
      this.props.onAction(this.props.items[index])
    }
  }

  renderGroupedItems() {
    const {ripple} = this.props
    const {focusedItem, items} = this.state

    return items.map((item, index) => {
      const prev = items[index - 1]
      return (
        <MenuItem
          key={index}
          item={item}
          ripple={ripple}
          danger={item.danger}
          isDisabled={item.isDisabled}
          isFocused={item === focusedItem}
          onFocus={this.handleFocus}
          onAction={this.handleAction}
          className={prev && prev.group !== item.group ? styles.divider : ''}
        />
      )
    })
  }

  render() {
    const {className} = this.props
    return (
      <div className={classNames([styles.root, className])}>
        <ul className={styles.list}>{this.renderGroupedItems()}</ul>
      </div>
    )
  }
}

export default withRouterHOC(enhanceWithClickOutside(DefaultMenu))
