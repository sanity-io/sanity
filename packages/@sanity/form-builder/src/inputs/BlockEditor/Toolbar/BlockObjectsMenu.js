// @flow

import type {Type, SlateChange, SlateValue} from '../typeDefs'

import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import {insertBlockObject, insertInlineObject} from '../utils/changes'

type Props = {
  editorValue: SlateValue,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  types: Type[]
}

type BlockItem = {
  title: string,
  value: Type
}

export default class InsertBlocks extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.types !== nextProps.types
  }

  getItems() {
    return this.props.types.map(type => ({
      title: type.title,
      value: type
    }))
  }

  handleOnAction = (item: BlockItem) => {
    const isInline = item.value.options && item.value.options.inline
    const {editorValue, onChange, onFocus} = this.props
    const change = editorValue.change()
    if (isInline) {
      change.call(insertInlineObject, item.value)
    } else {
      change.call(insertBlockObject, item.value)
    }
    change.blur()
    const focusKey = change.value.selection.focusKey
    const focusBlock = change.value.document.getClosestBlock(focusKey)
    const focusPath = [{_key: focusBlock.key}, FOCUS_TERMINATOR]
    onChange(change, () => onFocus(focusPath))
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
