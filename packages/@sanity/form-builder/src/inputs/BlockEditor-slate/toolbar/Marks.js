import React, {PropTypes} from 'react'
import ToggleButton from 'part:@sanity/components/toggles/button'

import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

import styles from './styles/Marks.css'

export const mark = PropTypes.shape({
  active: PropTypes.bool,
  type: PropTypes.string
})

export default class Marks extends React.Component {

  static propTypes = {
    onClick: PropTypes.func,
    marks: PropTypes.arrayOf(mark)
  }

  getIcon(type) {
    switch (type) {
      case 'strong':
        return FormatBoldIcon
      case 'em':
        return FormatItalicIcon
      case 'underline':
        return FormatUnderlinedIcon
      case 'line-through':
        return FormatStrikethroughIcon
      default:
        return SanityLogoIcon
    }
  }

  renderMarkButton = item => {
    const onClick = event => {
      this.props.onClick(event, item.type)
    }
    const Icon = this.getIcon(item.type)
    let title = item.type
    title = title.charAt(0).toUpperCase() + title.slice(1)
    return (
      <ToggleButton
        key={`markButton${item.type}`}
        selected={!!item.active}
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
