// @flow

import type {Type, SlateChange, SlateValue} from '../typeDefs'

import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

import {insertBlock} from '../utils/changes'

type Props = {
  editorValue: SlateValue,
  onChange: (change: SlateChange) => void,
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
    const {editorValue, onChange} = this.props
    const change = editorValue.change()
    change.call(insertBlock, item.value)
    onChange(change)
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
