import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/toggles/button-style'
import Button from 'part:@sanity/components/buttons/default'

export default class ToggleButton extends React.Component {
  static propTypes = {
    icon: PropTypes.func,
    onClick: PropTypes.func.isRequired,
    selected: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    title: PropTypes.string
  }

  static defaultProps = {
    className: '',
    disabled: false
  }

  render() {
    const {selected, className} = this.props
    const buttonClasses = `
      ${selected ? styles.selected : styles.unSelected}
      ${className}
    `
    return (
      <Button {...this.props} className={buttonClasses} kind="simple">
        {this.props.children}
      </Button>
    )
  }
}
