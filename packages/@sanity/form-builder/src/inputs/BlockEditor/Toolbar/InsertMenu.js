// @flow

import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

import type {Type, SlateValue, SlateController, Path} from '../typeDefs'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import {insertBlockObject, insertInlineObject} from '../utils/changes'

type Props = {
  blockTypes: Type[],
  controller: SlateController,
  editorValue: SlateValue,
  inlineTypes: Type[],
  onFocus: Path => void,
  type: Type
}

type BlockItem = {
  title: string,
  value: Type,
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

  getItems() {
    const {editorValue, controller} = this.props
    const {focusBlock} = editorValue
    const blockItems = this.props.blockTypes.map(type => ({
      title: `${type.title} ¶`,
      value: type,
      isInline: false,
      isDisabled: false
    }))
    const inlineItems = this.props.inlineTypes.map(type => ({
      title: type.title,
      value: type,
      isInline: true,
      isDisabled: focusBlock ? controller.query('isVoid', focusBlock) : true
    }))
    return blockItems.concat(inlineItems)
  }

  handleOnAction = (item: BlockItem) => {
    const {onFocus, controller, editorValue} = this.props
    const focusKey = editorValue.selection.focus.key
    const focusBlock = editorValue.document.getClosestBlock(focusKey)
    let focusPath = [{_key: focusBlock.key}]
    controller.change(change => {
      if (item.isInline) {
        controller.command('insertInlineObject', {objectType: item.value})
        focusPath = [
          {_key: focusBlock.key},
          'children',
          {_key: change.value.focusInline.key},
          FOCUS_TERMINATOR
        ]
      } else {
        controller.command('insertBlockObject', {objectType: item.value})
        change.focus()
        focusPath = [{_key: change.value.focusBlock.key}, FOCUS_TERMINATOR]
      }
      setTimeout(() => onFocus(focusPath), 200)
    })
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
