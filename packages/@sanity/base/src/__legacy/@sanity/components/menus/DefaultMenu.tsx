/* eslint-disable max-depth */

import React from 'react'
import {groupBy, flatten} from 'lodash'
import {withRouterHOC} from 'part:@sanity/base/router'
import styles from 'part:@sanity/components/menus/default-style'
import enhanceWithClickOutside from 'react-click-outside'
import classNames from 'classnames'
import DefaultMenuItem from './DefaultMenuItem'
import {MenuItemGroup as MenuItemGroupType, MenuItem as MenuItemType} from './types'

interface DefaultMenuProps {
  id?: string
  onAction: (item: MenuItemType) => void
  className?: string
  // onClickOutside?: (event: any) => void
  onClose?: (event?: KeyboardEvent) => void
  items: MenuItemType[]
  groups?: MenuItemGroupType[]
  router?: {
    navigateIntent: (intentName: string, params?: Record<string, string>) => void
  }
}

interface State {
  focusedItem?: MenuItemType
  items: MenuItemType[]
}

const ungrouped = Symbol('__ungrouped__')

class DefaultMenu extends React.Component<DefaultMenuProps, State> {
  state: State = {
    items: [],
  }

  static getDerivedStateFromProps(props: DefaultMenuProps) {
    const groups = props.items.reduce(
      (acc, item) => {
        if (!item.group) {
          return acc
        }

        return acc.includes(item.group) ? acc : acc.concat(item.group)
      },
      (props.groups || []).map((group) => group.id)
    )

    const byGroup = groupBy(props.items, (item) => item.group || ungrouped)
    // @todo: symbol cannot be used as index type
    const hasUngrouped = typeof byGroup[ungrouped as any] !== 'undefined'
    let targets: Array<string | symbol> = []
    if (hasUngrouped) {
      targets.push(ungrouped, ...groups)
    } else {
      targets = groups
    }
    // @todo: symbol cannot be used as index type
    const items = flatten(targets.map((group) => byGroup[group as any] || []))
    return {items}
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  // eslint-disable-next-line complexity
  handleKeyDown = (event: KeyboardEvent) => {
    const {router} = this.props
    const {focusedItem} = this.state
    const items = this.state.items ? this.state.items.filter((item) => !item.isDisabled) : []
    const currentIndex = focusedItem ? items.indexOf(focusedItem) || 0 : 0

    if (event.key === 'Escape') {
      this.setState({focusedItem: undefined})
      if (this.props.onClose) this.props.onClose(event)
    }

    if (event.key === 'ArrowDown') {
      this.setState({
        focusedItem: items[currentIndex < items.length - 1 ? currentIndex + 1 : 0],
      })
    }

    if (event.key === 'ArrowUp') {
      this.setState({
        focusedItem: items[currentIndex > 0 ? currentIndex - 1 : items.length - 1],
      })
    }

    if (event.key === 'Enter' && focusedItem) {
      if (focusedItem.intent) {
        if (router) {
          // @todo: typings
          router.navigateIntent(focusedItem.intent.type, focusedItem.intent.params as any)
        }
      } else {
        this.props.onAction(focusedItem)
      }
    }
  }

  handleAction = (event: React.MouseEvent<HTMLAnchorElement>, item: MenuItemType) => {
    event.stopPropagation()

    if (item.intent) {
      if (this.props.onClose) this.props.onClose()
    } else {
      this.props.onAction(item)
    }
  }

  handleFocus = (_: React.FocusEvent<HTMLAnchorElement>, item: MenuItemType) => {
    this.setState({focusedItem: item})
  }

  renderGroupedItems() {
    const {focusedItem, items} = this.state

    return items.map((item, index) => {
      const prev = items[index - 1]

      return (
        <DefaultMenuItem
          key={String(index)}
          item={item}
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
      <div className={classNames(styles.root, className)}>
        <ul className={styles.list}>{this.renderGroupedItems()}</ul>
      </div>
    )
  }
}

export default (withRouterHOC(
  enhanceWithClickOutside(DefaultMenu as any)
) as any) as React.ComponentClass<DefaultMenuProps>
