import React, {PropTypes} from 'react'
import addons from '@kadira/storybook-addons'

export class Role extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    roles: PropTypes.array
  }
  render() {
    const {children, roles} = this.props
    const channel = addons.getChannel()

    channel.emit('kadira/notes/add_notes', roles)

    return (
      <div>
        Here is the children {children}
      </div>
    )
  }
}
