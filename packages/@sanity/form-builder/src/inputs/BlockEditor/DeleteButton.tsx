import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
type Props = {
  onClick: (arg0: void) => void
  children: React.ReactNode
}
export default class DeleteButton extends React.Component<Props, {}> {
  handleClick = event => {
    this.props.onClick(event)
  }
  render() {
    return (
      <Button kind="simple" color="danger" icon={TrashIcon} onClick={this.handleClick}>
        {this.props.children}
      </Button>
    )
  }
}
