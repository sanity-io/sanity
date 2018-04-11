// @flow

import type {BlockContentFeature, BlockContentFeatures, SlateChange, SlateValue} from '../typeDefs'

import React from 'react'

import {toggleListItem} from '../utils/changes'

import CustomIcon from './CustomIcon'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import ToolbarClickAction from './ToolbarClickAction'

import styles from './styles/ListItemButtons.css'

type ListItem = BlockContentFeature & {active: boolean, disabled: boolean}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  onChange: (change: SlateChange) => void
}

function getIcon(type: string) {
  switch (type) {
    case 'number':
      return FormatListNumberedIcon
    case 'bullet':
      return FormatListBulletedIcon
    default:
      return SanityLogoIcon
  }
}

const NOOP = () => {}

export default class ListItemButtons extends React.Component<Props> {
  hasListItem(listItemName: string) {
    const {editorValue} = this.props
    return editorValue.blocks.some(block => {
      return block.data.get('listItem') === listItemName
    })
  }

  getItems() {
    const {blockContentFeatures, editorValue} = this.props
    const {focusBlock} = editorValue
    const disabled = focusBlock ? focusBlock.isVoid : false
    return blockContentFeatures.lists.map((listItem: BlockContentFeature) => {
      return {
        ...listItem,
        active: this.hasListItem(listItem.value),
        disabled
      }
    })
  }

  handleClick = (item: ListItem) => {
    const {onChange, editorValue} = this.props
    const change = editorValue.change()
    change.call(toggleListItem, item.value)
    onChange(change)
  }

  renderListItemButton = (item: ListItem) => {
    const {editorValue} = this.props
    let Icon
    const icon = item.blockEditor ? item.blockEditor.icon : null
    if (icon) {
      if (typeof icon === 'string') {
        Icon = () => <CustomIcon icon={icon} active={!!item.active} />
      } else if (typeof icon === 'function') {
        Icon = icon
      }
    }
    Icon = Icon || getIcon(item.value)
    const onAction = () => this.handleClick(item)
    return (
      <ToolbarClickAction
        onAction={onAction}
        editorValue={editorValue}
        key={`listItemButton${item.value}`}
      >
        <ToggleButton
          selected={item.active}
          disabled={item.disabled}
          onClick={NOOP}
          title={item.title}
          className={styles.button}
          icon={Icon}
        />
      </ToolbarClickAction>
    )
  }

  render() {
    const items = this.getItems()
    return <div className={styles.root}>{items.map(this.renderListItemButton)}</div>
  }
}
