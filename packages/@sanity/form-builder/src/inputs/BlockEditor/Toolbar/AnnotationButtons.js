// @flow

import React from 'react'
import {Value as SlateValue, Range} from 'slate'
import {randomKey} from '@sanity/block-tools'
import LinkIcon from 'part:@sanity/base/link-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ButtonGroup from 'part:@sanity/components/buttons/button-group'
import ToggleButton from 'part:@sanity/components/toggles/button'
import type {BlockContentFeature, BlockContentFeatures, Path, SlateEditor} from '../typeDefs'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import CustomIcon from './CustomIcon'

type AnnotationItem = BlockContentFeature & {
  active: boolean,
  disabled: boolean
}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  editorValue: SlateValue,
  onFocus: Path => void,
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

export default class AnnotationButtons extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const {editor} = this.props
    if (nextProps.userIsWritingText) {
      return false
    }
    if (
      nextProps.userIsWritingText !== this.props.userIsWritingText ||
      nextProps.editorValue.inlines.size !== this.props.editorValue.inlines.size ||
      editor.query('hasSelectionWithText', this.props.editorValue) === false ||
      editor.query('hasSelectionWithText', nextProps.editorValue) === false
    ) {
      return true
    }
    return false
  }

  getItems() {
    const {editor, blockContentFeatures, editorValue, userIsWritingText} = this.props
    const {inlines} = editorValue

    const disabled =
      userIsWritingText ||
      editor.query('hasSelectionWithText') === false ||
      inlines.some(inline => inline.type !== 'span')
    return blockContentFeatures.annotations.map((annotation: BlockContentFeature) => {
      return {
        ...annotation,
        active: editor.query('hasAnnotation', annotation.value),
        disabled
      }
    })
  }

  handleClick = (item: AnnotationItem, originalSelection: Range) => {
    const {editor, onFocus} = this.props
    if (item.disabled) {
      return
    }
    const key = randomKey(12)
    editor.command('toggleAnnotation', {annotationName: item.value, key})
    if (editor.value.startInline) {
      // Make the block editor focus the annotation input if we added an annotation
      editor.blur()
      const focusPath = [
        {_key: editor.value.focusBlock.key},
        'markDefs',
        {_key: key},
        FOCUS_TERMINATOR
      ]
      setTimeout(() => {
        onFocus(focusPath)
      }, 200)
      return
    }
    editor.focus()
  }

  renderAnnotationButton = (item: AnnotationItem) => {
    const {editor} = this.props
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

    return (
      <ToggleButton
        selected={!!item.active}
        disabled={item.disabled}
        onClick={() => this.handleClick(item, editor.value.selection)}
        title={item.title}
        icon={Icon}
      />
    )
  }

  render() {
    const items = this.getItems()
    return <ButtonGroup>{items.map(this.renderAnnotationButton)}</ButtonGroup>
  }
}
