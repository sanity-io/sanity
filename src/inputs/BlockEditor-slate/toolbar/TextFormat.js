import React, {PropTypes} from 'react'
import styles from './styles/TextFormat.css'
import ToggleButton from 'part:@sanity/components/toggles/button'

import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'

import {
  SLATE_TEXT_BLOCKS,
  SLATE_LIST_ITEM_TYPE
} from '../constants'


export default class TextFormatToolbar extends React.Component {

  static propTypes = {
    value: PropTypes.object,
    groupedFields: PropTypes.object,
    onChange: PropTypes.func
  }

  handleOnClickMarkButton = (event, type) => {
    event.preventDefault()
    const {value, onChange} = this.props
    const nextState = value.state
      .transform()
      .toggleMark(type)
      .apply()
    onChange({patch: {localState: nextState}})
  }

  getIcon(type) {
    switch (type) {
      case 'bold':
        return FormatBoldIcon
      case 'italic':
        return FormatItalicIcon
      case 'underline':
        return FormatUnderlinedIcon
      case 'line-through':
        return FormatStrikethroughIcon
      default:
        return SanityLogoIcon
    }
  }

  hasMark(type) {
    const {value} = this.props
    return value.state.marks.some(mark => mark.type == type)
  }

  renderMarkButton = type => {
    const isActive = this.hasMark(type)
    const onClick = event => {
      this.handleOnClickMarkButton(event, type)
    }
    const Icon = this.getIcon(type)
    return (
      <ToggleButton key={`markButton${type}`} selected={isActive} onClick={onClick} title={type} className={styles.button}>
        <div className={styles.iconContainer}>
          <Icon />
        </div>
      </ToggleButton>
    )
  }

  render() {
    const {value, groupedFields} = this.props
    if (!value.state.blocks) {
      return null
    }
    const anchorBlock = value.state.blocks
      .filter(node => SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE)
        .includes(node.type) && value.state.selection.hasAnchorIn(node)
      )
      .map(node => node.type).toArray()[0]
    if (!anchorBlock) {
      return null
    }
    const marksField = groupedFields.slate.find(field => field.type === anchorBlock)
    if (!marksField) {
      return null
    }
    const allowedMarks = marksField.marks
    return allowedMarks.length ? (
      <div className={styles.root}>
        {allowedMarks.map(this.renderMarkButton)}
      </div>
    ) : null
  }
}
