// @flow

import React from 'react'
import {isEqual} from 'lodash'
import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import FormatCodeIcon from 'part:@sanity/base/format-code-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import ButtonGroup from 'part:@sanity/components/buttons/button-group'
import type {BlockContentFeature, BlockContentFeatures, SlateValue, SlateEditor} from '../typeDefs'

import {keyMaps} from '../plugins/SetMarksOnKeyComboPlugin'

type DecoratorItem = BlockContentFeature & {active: boolean, disabled: boolean}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  editorValue: SlateValue
}

function getIcon(type: string) {
  switch (type) {
    case 'strong':
      return FormatBoldIcon
    case 'em':
      return FormatItalicIcon
    case 'underline':
      return FormatUnderlinedIcon
    case 'strike-through':
      return FormatStrikethroughIcon
    case 'code':
      return FormatCodeIcon
    default:
      return SanityLogoIcon
  }
}

export default class DecoratorButtons extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const nextMarks = nextProps.editorValue.marks.map(mrk => mrk.type)
    const currentMarks = this.props.editorValue.marks.map(mrk => mrk.type)
    if (isEqual(nextMarks, currentMarks)) {
      return false
    }
    return true
  }

  getItems() {
    const {editor, blockContentFeatures} = this.props
    const {focusBlock} = editor.value
    const disabled = focusBlock ? editor.query('isVoid', focusBlock) : false
    return blockContentFeatures.decorators.map((decorator: BlockContentFeature) => {
      return {
        ...decorator,
        active: editor.query('hasMark', decorator.value),
        disabled
      }
    })
  }

  handleClick = (item: DecoratorItem) => {
    const {editor} = this.props
    editor.toggleMark(item.value).focus()
  }

  renderDecoratorButton = (item: DecoratorItem) => {
    const icon = item.blockEditor ? item.blockEditor.icon : null
    const Icon = icon || getIcon(item.value)
    const shortCut = keyMaps[item.value] ? `(${keyMaps[item.value]})` : ''
    const title = `${item.title} ${shortCut}`
    return (
      <ToggleButton
        selected={!!item.active}
        disabled={item.disabled}
        onClick={() => this.handleClick(item)}
        title={title}
        icon={Icon}
      />
    )
  }

  render() {
    const items = this.getItems()
    return <ButtonGroup>{items.map(this.renderDecoratorButton)}</ButtonGroup>
  }
}
