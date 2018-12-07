import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/toggles/button-style'
import Button from 'part:@sanity/components/buttons/default'

export default class ToggleButton extends React.PureComponent {
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
    const {disabled, selected, icon, className, title} = this.props

    return (
      <Button
        className={`${selected ? styles.selected : styles.unSelected} ${className}`}
        color="primary"
        icon={icon}
        title={title}
        disabled={disabled}
        kind="simple"
        onClick={this.props.onClick}
      >
        {this.props.children}
      </Button>
    )
  }
}
