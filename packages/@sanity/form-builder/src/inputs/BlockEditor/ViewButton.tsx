import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
type Props = {
  onClick: (arg0: void) => void
  children: React.ReactNode
}
export default class ViewButton extends React.Component<Props, {}> {
  handleClick = event => {
    this.props.onClick(event)
  }
  render() {
    return (
      <Button kind="simple" icon={VisibilityIcon} onClick={this.handleClick}>
        {this.props.children}
      </Button>
    )
  }
}
