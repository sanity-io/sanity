// @flow

import * as React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import EditIcon from 'part:@sanity/base/edit-icon'

type Props = {
  onClick: (SyntheticMouseEvent<>) => void,
  children?: React.Node
}

export default class EditButton extends React.Component<Props> {
  static defaultProps = {
    children: []
  }
  handleClick = (event: SyntheticMouseEvent<>) => {
    this.props.onClick(event)
  }
  render() {
    return (
      <Button kind="simple" icon={EditIcon} onClick={this.handleClick}>
        {this.props.children}
      </Button>
    )
  }
}
