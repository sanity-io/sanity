import React, {PropTypes} from 'react'

import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'

import styles from './styles/ListItems.css'

export const listItem = PropTypes.shape({
  active: PropTypes.bool,
  type: PropTypes.string,
  title: PropTypes.string
})

export default class ListItem extends React.Component {

  static propTypes = {
    onClick: PropTypes.func,
    listItems: PropTypes.arrayOf(listItem)
  }

  getIcon(type) {
    switch (type) {
      case 'number':
        return FormatListNumberedIcon
      case 'bullet':
        return FormatListBulletedIcon
      default:
        return SanityLogoIcon
    }
  }


  renderButton = listFormat => {
    const onClick = event => {
      this.props.onClick(listFormat.type, listFormat.active)
    }
    const Icon = this.getIcon(listFormat.type)
    return (
      <ToggleButton
        key={`listButton${listFormat.type}`}
        selected={listFormat.active}
        onClick={onClick}
        title={listFormat.title}
      >
        <div className={styles.iconContainer}>
          <Icon />
        </div>
      </ToggleButton>
    )
  }


  render() {
    return (
      <div className={styles.root}>
        {
          this.props.listItems.map(this.renderButton)
        }
      </div>
    )
  }
}
