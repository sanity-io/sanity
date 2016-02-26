import React, {Component} from 'react'
import plugins from '@sanity/plugin-loader/plugins'

// @todo move to separate repo
class Sanity extends Component {
  render() {
    return <div>Root component here!</div>
  }
}

Sanity.defaultProps = {
  roles: plugins
}

export default Sanity
