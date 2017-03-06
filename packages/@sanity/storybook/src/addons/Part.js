import React, {PropTypes} from 'react'
import addons from '@kadira/storybook-addons'

export class Part extends React.Component {
  render() {
    const {children, parts} = this.props
    const channel = addons.getChannel()

    channel.emit('kadira/notes/add_notes', parts)

    return (
      <div>
        Here is the children {children}
      </div>
    )
  }
}

Part.propTypes = {
  children: PropTypes.node,
  parts: PropTypes.array
}
