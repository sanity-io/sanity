// @flow

import React from 'react'
import {Value as SlateValue, Range} from 'slate'
import {randomKey} from '@sanity/block-tools'
import LinkIcon from 'part:@sanity/base/link-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import type {
  BlockContentFeature,
  BlockContentFeatures,
  Path,
  SlateChange,
  SlateEditor
} from '../typeDefs'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import CustomIcon from './CustomIcon'
import ToolbarClickAction from './ToolbarClickAction'

import styles from './styles/AnnotationButtons.css'

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

const NOOP = () => {}

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
    editor.change((change: SlateChange) => {
      const key = randomKey(12)
      editor.command('toggleAnnotation', {annotationName: item.value, key})
      // Make the block editor focus the annotation input
      const focusPath = [
        {_key: change.value.focusBlock.key},
        'markDefs',
        {_key: key},
        FOCUS_TERMINATOR
      ]
      setTimeout(() => {
        onFocus(focusPath)
      }, 200)
    })
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
    // We must not do a click-event here, because that messes with the editor focus!
    const onAction = (originalSelection: Range) => {
      this.handleClick(item, originalSelection)
    }
    return (
      <ToolbarClickAction
        onAction={onAction}
        editor={editor}
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
