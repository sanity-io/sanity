// @flow

import type {Type, SlateChange, SlateValue} from '../typeDefs'

import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import {insertBlockObject, insertInlineObject} from '../utils/changes'

type Props = {
  blockTypes: Type[],
  editorValue: SlateValue,
  inlineTypes: Type[],
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  type: Type
}

type BlockItem = {
  title: string,
  value: Type
}

export default class InsertMenu extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return (
      this.props.blockTypes !== nextProps.blockTypes ||
      this.props.inlineTypes !== nextProps.inlineTypes
    )
  }

  getItems() {
    const blockItems = this.props.blockTypes.map(type => ({
      title: `${type.title} ¶`,
      value: type,
      isInline: false
    }))
    const inlineItems = this.props.inlineTypes.map(type => ({
      title: type.title,
      value: type,
      isInline: true
    }))
    return blockItems.concat(inlineItems)
  }

  handleOnAction = (item: BlockItem) => {
    const {editorValue, onChange, onFocus, type} = this.props
    const change = editorValue.change()
    const focusKey = change.value.selection.focusKey
    const focusBlock = change.value.document.getClosestBlock(focusKey)
    let focusPath = [{_key: focusBlock.key}]
    if (item.isInline) {
      change.call(insertInlineObject, item.value, type)
      focusPath = [
        {_key: focusBlock.key},
        'children',
        {_key: change.value.focusInline.key},
        FOCUS_TERMINATOR
      ]
    } else {
      change.call(insertBlockObject, item.value).focus()
      focusPath = [{_key: change.value.focusBlock.key}, FOCUS_TERMINATOR]
    }
    onChange(change, () => setTimeout(() => onFocus(focusPath), 200))
  }

  render() {
    return (
      <DropDownButton
        items={this.getItems()}
        onAction={this.handleOnAction}
        kind="simple"
        origin="right"
      >
        Insert
      </DropDownButton>
    )
  }
}
