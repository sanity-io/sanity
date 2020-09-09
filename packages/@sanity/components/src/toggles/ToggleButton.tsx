import React from 'react'

// @todo: give a deprecation warning?
// import styles from 'part:@sanity/components/toggles/button-style'

import Button, {ButtonProps} from 'part:@sanity/components/buttons/default'

export default class ToggleButton extends React.Component<ButtonProps> {
  render() {
    return (
      <Button {...this.props} kind="simple">
        {this.props.children}
      </Button>
    )
  }
}
