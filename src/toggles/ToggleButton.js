import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/toggles/button-style'
import Button from 'part:@sanity/components/buttons/default'

export default class ToggleButton extends React.Component {
  static propTypes = {
    icon: PropTypes.func,
    onClick: PropTypes.func.isRequired,
    selected: PropTypes.bool,
    children: PropTypes.node
  }

  render() {
    const {selected, icon} = this.props
    const buttonClasses = `
      ${selected ? styles.selected : styles.unSelected}
    `
    return (
      <Button
        className={buttonClasses}
        icon={icon}
        onClick={this.props.onClick}
        kind="simple"
      >
        {this.props.children}
      </Button>
    )
  }
}
