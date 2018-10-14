// @flow

import React from 'react'
import {Change, Value as SlateValue, Range} from 'slate'

import LinkIcon from 'part:@sanity/base/link-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import type {BlockContentFeature, BlockContentFeatures, Path, SlateController} from '../typeDefs'
import CustomIcon from './CustomIcon'
import ToolbarClickAction from './ToolbarClickAction'

import styles from './styles/AnnotationButtons.css'

type AnnotationItem = BlockContentFeature & {
  active: boolean,
  disabled: boolean
}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  controller: SlateController,
  editorValue: SlateValue,
  userIsWritingText: boolean
}

function getIcon(type: string) {
  switch (type) {
    case 'link':
      return LinkIcon
    default:
      return SanityLogoIcon
  }
}

const NOOP = () => {}

function isNonTextSelection(editorValue: SlateValue) {
  const {focusText, selection} = editorValue
  const {isCollapsed} = selection
  return (
    !focusText ||
    (focusText &&
      isCollapsed &&
      focusText.text.substring(selection.focus.offset - 1, selection.focus.offset).trim() === '' &&
      focusText.text.substring(selection.focus.offset, selection.focus.offset + 1).trim() === '')
  )
}

export default class AnnotationButtons extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.userIsWritingText) {
      return false
    }
    if (
      nextProps.userIsWritingText !== this.props.userIsWritingText ||
      nextProps.editorValue.inlines.size !== this.props.editorValue.inlines.size ||
      isNonTextSelection(this.props.editorValue) ||
      isNonTextSelection(nextProps.editorValue)
    ) {
      return true
    }
    return false
  }

  hasAnnotation(annotationName: string) {
    const {editorValue} = this.props
    const spans = editorValue.inlines.filter(inline => inline.type === 'span')
    return spans.some(span => {
      const annotations = span.data.get('annotations') || {}
      return Object.keys(annotations).find(
        key => annotations[key] && annotations[key]._type === annotationName
      )
    })
  }

  getItems() {
    const {controller, blockContentFeatures, editorValue, userIsWritingText} = this.props
    const {inlines, focusBlock} = editorValue

    const disabled =
      userIsWritingText ||
      inlines.some(inline => inline.type !== 'span') ||
      (focusBlock ? controller.query('isVoid', focusBlock) || focusBlock.text === '' : false) ||
      isNonTextSelection(editorValue)
    return blockContentFeatures.annotations.map((annotation: BlockContentFeature) => {
      return {
        ...annotation,
        active: this.hasAnnotation(annotation.value),
        disabled
      }
    })
  }

  handleClick = (item: AnnotationItem, originalSelection: Range) => {
    const {controller} = this.props
    if (item.disabled) {
      return
    }
    controller.command('toggleAnnotation', item.value)
  }

  renderAnnotationButton = (item: AnnotationItem) => {
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
    // We must not do a click-event here, because that messes with the editor focus!
    const onAction = (originalSelection: Range) => {
      this.handleClick(item, originalSelection)
    }
    return (
      <ToolbarClickAction
        onAction={onAction}
        editorValue={editorValue}
        key={`annotationButton${item.value}`}
      >
        <ToggleButton
          selected={!!item.active}
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
    return <div className={styles.root}>{items.map(this.renderAnnotationButton)}</div>
  }
}
