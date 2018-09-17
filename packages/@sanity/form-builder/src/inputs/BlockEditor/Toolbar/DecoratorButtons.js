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
import {toggleMark} from '../utils/changes'
import type {BlockContentFeature, BlockContentFeatures, SlateChange, SlateValue} from '../typeDefs'

import {keyMaps} from '../plugins/SetMarksOnKeyComboPlugin'
import ToolbarClickAction from './ToolbarClickAction'

import styles from './styles/DecoratorButtons.css'

type DecoratorItem = BlockContentFeature & {active: boolean, disabled: boolean}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  onChange: (change: SlateChange) => void
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

const NOOP = () => {}

export default class DecoratorButtons extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const nextMarks = nextProps.editorValue.marks.map(mrk => mrk.type)
    const currentMarks = this.props.editorValue.marks.map(mrk => mrk.type)
    if (isEqual(nextMarks, currentMarks)) {
      return false
    }
    return true
  }
  hasDecorator(decoratorName: string) {
    const {editorValue} = this.props
    return editorValue.marks.some(mark => mark.type === decoratorName)
  }

  getItems() {
    const {blockContentFeatures, editorValue} = this.props
    const {focusBlock} = editorValue
    const disabled = focusBlock ? focusBlock.isVoid : false
    return blockContentFeatures.decorators.map((decorator: BlockContentFeature) => {
      return {
        ...decorator,
        active: this.hasDecorator(decorator.value),
        disabled
      }
    })
  }

  handleClick = (item: DecoratorItem) => {
    const {onChange, editorValue} = this.props
    const change = editorValue.change()
    change.call(toggleMark, item.value)
    onChange(change)
  }

  renderDecoratorButton = (item: DecoratorItem) => {
    const {editorValue} = this.props
    const icon = item.blockEditor ? item.blockEditor.icon : null
    const Icon = icon || getIcon(item.value)
    // We must not do a click-event here, because that messes with the editor focus!
    const onAction = () => {
      this.handleClick(item)
    }
    const shortCut = keyMaps[item.value] ? `(${keyMaps[item.value]})` : ''
    const title = `${item.title} ${shortCut}`
    return (
      <span className={styles.buttonWrapper} key={item.value}>
        <ToolbarClickAction
          onAction={onAction}
          editorValue={editorValue}
          key={`decoratorButton${item.value}`}
        >
          <ToggleButton
            selected={!!item.active}
            disabled={item.disabled}
            onClick={NOOP}
            title={title}
            className={styles.button}
            icon={Icon}
          />
        </ToolbarClickAction>
      </span>
    )
  }

  render() {
    const items = this.getItems()
    return <div className={styles.root}>{items.map(this.renderDecoratorButton)}</div>
  }
}
