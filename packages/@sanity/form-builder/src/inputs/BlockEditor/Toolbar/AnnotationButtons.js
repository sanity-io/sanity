// @flow

import type {BlockContentFeature, BlockContentFeatures} from '../typeDefs'

import React from 'react'
import {Change, Value as SlateValue, Range} from 'slate'

import {createFormBuilderSpan, removeAnnotationFromSpan} from '../utils/changes'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import randomKey from '../utils/randomKey'

import CustomIcon from './CustomIcon'
import LinkIcon from 'part:@sanity/base/link-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import ToolbarClickAction from './ToolbarClickAction'

import styles from './styles/AnnotationButtons.css'

type AnnotationItem = BlockContentFeature & {
  active: boolean,
  disabled: boolean
}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  focusPath: [],
  onChange: Change => void,
  onFocus: (nextPath: []) => void
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
  hasAnnotation(annotationName: string) {
    const {editorValue} = this.props
    const spans = editorValue.inlines.filter(inline => inline.type === 'span')
    return spans.some(span => {
      const annotations = span.data.get('annotations') || {}
      return Object.keys(annotations).find(key => annotations[key]._type === annotationName)
    })
  }

  getItems() {
    const {blockContentFeatures, editorValue} = this.props
    const {inlines, focusBlock} = editorValue
    const disabled =
      inlines.some(inline => inline.type !== 'span') ||
      (focusBlock ? focusBlock.isVoid || focusBlock.text === '' : false)
    return blockContentFeatures.annotations.map((annotation: BlockContentFeature) => {
      return {
        ...annotation,
        active: this.hasAnnotation(annotation.value),
        disabled
      }
    })
  }

  handleClick = (item: AnnotationItem, originalSelection: Range) => {
    const {editorValue, onChange, onFocus, focusPath} = this.props
    const change = editorValue.change()
    if (item.active) {
      const spans = editorValue.inlines.filter(inline => inline.type === 'span')
      spans.forEach(span => {
        change.call(removeAnnotationFromSpan, span, item.value)
      })
      onChange(change)
      return
    }
    const key = randomKey(12)
    change.call(createFormBuilderSpan, item.value, key, originalSelection)
    change.collapseToEndOf(change.value.inlines.first())
    onChange(change, () => onFocus([focusPath[0], 'markDefs', {_key: key}, FOCUS_TERMINATOR]))
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
        >
          <div className={styles.iconContainer}>
            <Icon />
          </div>
        </ToggleButton>
      </ToolbarClickAction>
    )
  }

  render() {
    const items = this.getItems()
    return <div className={styles.root}>{items.map(this.renderAnnotationButton)}</div>
  }
}
