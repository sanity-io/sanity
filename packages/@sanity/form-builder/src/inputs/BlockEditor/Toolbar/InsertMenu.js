// @flow

import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import BlockObjectIcon from 'part:@sanity/base/block-object-icon'
import InlineObjectIcon from 'part:@sanity/base/inline-object-icon'

import type {Type, SlateValue, SlateEditor, Path} from '../typeDefs'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import styles from './styles/InsertMenu.css'

type Props = {
  blockTypes: Type[],
  editor: SlateEditor,
  editorValue: SlateValue,
  inlineTypes: Type[],
  onFocus: Path => void
}

type BlockItem = {
  title: string,
  value: Type,
  icon: any,
  isInline: boolean,
  isDisabled: boolean
}

export default class InsertMenu extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return (
      this.props.blockTypes !== nextProps.blockTypes ||
      this.props.inlineTypes !== nextProps.inlineTypes ||
      this.props.editorValue.focusBlock !== nextProps.editorValue.focusBlock
    )
  }

  renderItem = (item: BlockItem) => {
    const Icon = item.icon
    return (
      <div className={styles.item}>
        {Icon && (
          <div className={styles.icon}>
            <Icon />
          </div>
        )}
        {item.title}
      </div>
    )
  }

  getIcon = (type, fallbackIcon) => {
    return type.icon || (type.type && type.type.icon) || fallbackIcon
  }

  getItems() {
    const {editor} = this.props
    const {focusBlock} = editor.value
    const blockItems = this.props.blockTypes.map(type => ({
      title: type.title,
      value: type,
      icon: this.getIcon(type, BlockObjectIcon),
      isInline: false,
      isDisabled: false
    }))
    const inlineItems = this.props.inlineTypes.map(type => ({
      title: type.title,
      icon: this.getIcon(type, InlineObjectIcon),
      value: type,
      isInline: true,
      isDisabled: focusBlock ? editor.query('isVoid', focusBlock) : true
    }))
    return blockItems.concat(inlineItems)
  }

  handleOnAction = (item: BlockItem) => {
    const {onFocus, editor} = this.props
    let focusPath
    if (item.isInline) {
      editor.command('insertInlineObject', {objectType: item.value})
      focusPath = [
        {_key: editor.value.focusBlock.key},
        'children',
        {_key: editor.value.focusInline.key},
        FOCUS_TERMINATOR
      ]
    } else {
      editor.command('insertBlockObject', {objectType: item.value})
      focusPath = [{_key: editor.value.focusBlock.key}, FOCUS_TERMINATOR]
    }
    setTimeout(() => onFocus(focusPath), 200)
  }

  render() {
    return (
      <DropDownButton
        items={this.getItems()}
        renderItem={this.renderItem}
        onAction={this.handleOnAction}
        kind="simple"
      >
        Insert
      </DropDownButton>
    )
  }
}
