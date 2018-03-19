import PropTypes from 'prop-types'
import React from 'react'
import ToggleButton from 'part:@sanity/components/toggles/button'

import LinkIcon from 'part:@sanity/base/link-icon'

import styles from './styles/AnnotationButton.css'

export default class AnnotationButton extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    annotation: PropTypes.object
  }

  handleToggleButtonClick = () => {
    this.props.onClick(this.props.annotation)
  }

  render() {
    const {annotation} = this.props
    return (
      <ToggleButton
        onClick={this.handleToggleButtonClick}
        title={annotation.type.title}
        disabled={annotation.disabled}
        selected={annotation.active}
        className={styles.button}
        icon={LinkIcon}
      />
    )
  }
}
