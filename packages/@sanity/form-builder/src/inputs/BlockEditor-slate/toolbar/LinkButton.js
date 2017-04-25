import PropTypes from 'prop-types'
import React from 'react'
import ToggleButton from 'part:@sanity/components/toggles/button'

import LinkIcon from 'part:@sanity/base/link-icon'
import DeleteIcon from 'part:@sanity/base/trash-outline-icon'

import styles from './styles/LinkButton.css'

export default class LinkButton extends React.Component {

  static propTypes = {
    onClick: PropTypes.func,
    activeLinks: PropTypes.arrayOf(PropTypes.object)
  }

  handleToggleButtonClick = () => {
    this.props.onClick(this.props.activeLinks)
  }

  renderDelete() {
    const {activeLinks} = this.props
    if (activeLinks.length > 1) {
      return <DeleteIcon className={styles.DeleteIcon} />
    }
    return null
  }

  render() {
    const {activeLinks} = this.props
    return (
      <div style={{position: 'relative'}}>
        <ToggleButton
          onClick={this.handleToggleButtonClick}
          title={'Link'}
          selected={activeLinks.length > 0}
          className={styles.button}
        >
          <div className={styles.iconContainer}>
            { this.renderDelete() }
            <LinkIcon />
          </div>
        </ToggleButton>

      </div>
    )
  }
}
