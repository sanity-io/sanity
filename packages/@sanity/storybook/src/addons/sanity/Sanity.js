import React, {PureComponent, PropTypes} from 'react' // eslint-disable-line no-unused-vars
import addons from '@kadira/storybook-addons'
import parts from 'sanity:debug'
import extractPropTypes from './extractPropTypes'

export default class Sanity extends PureComponent {
  render() {
    const {children, part, propTables} = this.props
    const channel = addons.getChannel()
    const info = {part, propTypes: extractPropTypes(propTables)}

    if (part) {
      info.basePath = parts.basePath
      info.definition = parts.definitions[part]
      info.implementations = parts.implementations[part]
    }

    channel.emit('sanity/info/set-info', info)
    return children
  }
}

Sanity.propTypes = {
  propTables: PropTypes.arrayOf(React.PropTypes.func),
  children: PropTypes.node,
  part: PropTypes.string
}

Sanity.defaultProps = {
  propTables: []
}
