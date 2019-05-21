import React from 'react'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import styles from './styles/CollapsibleButtonGroup.css'
import PropTypes from 'prop-types'

export default class CollapsibleButtonGroup extends React.Component {
  state = {
    isOpen: false
  }

  handleOpen = () => {
    this.setState({isOpen: true})
  }

  handleClose = () => {
    this.setState({isOpen: false})
  }

  handleToggle = () => {
    const {isOpen} = this.state
    if (isOpen) {
      this.handleClose()
    } else {
      this.handleOpen()
    }
  }

  render() {
    const {icon, children} = this.props
    const {isOpen} = this.state
    const Icon = icon

    return (
      <div className={styles.root}>
        <ToggleButton onClick={this.handleToggle}>
          <Icon />
          <ChevronDown />
        </ToggleButton>
        {isOpen && <div className={styles.popup}>{children}</div>}
      </div>
    )
  }
}

CollapsibleButtonGroup.propTypes = {
  children: PropTypes.node,
  icon: PropTypes.any
}
