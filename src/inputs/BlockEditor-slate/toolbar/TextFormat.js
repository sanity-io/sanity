import React, {PropTypes} from 'react'
import ToggleButton from 'part:@sanity/components/toggles/button'

import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

import styles from './styles/TextFormat.css'

export const textFormatShape = PropTypes.shape({
  active: PropTypes.bool,
  type: PropTypes.string
})

export default class TextFormatToolbar extends React.Component {

  static propTypes = {
    onClick: PropTypes.func,
    marks: PropTypes.arrayOf(textFormatShape)
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

  renderMarkButton = mark => {
    const onClick = event => {
      this.props.onClick(event, mark.type)
    }
    const Icon = this.getIcon(mark.type)
    let title = mark.type
    title = title.charAt(0).toUpperCase() + title.slice(1)
    return (
      <ToggleButton
        key={`markButton${mark.type}`}
        selected={!!mark.active}
        onClick={onClick}
        title={title}
        className={styles.button}
      >
        <div className={styles.iconContainer}>
          <Icon />
        </div>
      </ToggleButton>
    )
  }

  render() {
    return this.props.marks ? (
      <div className={styles.root}>
        {this.props.marks.map(this.renderMarkButton)}
      </div>
    ) : null
  }
}
