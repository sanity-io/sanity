import React, {PropTypes} from 'react'

export default class CustomPreview extends React.Component {
  static propTypes = {
    emptyText: PropTypes.string,
    children: PropTypes.node
  }

  render() {
    const {children} = this.props
    return (
      <div>
        {children}
      </div>
    )
  }
}
