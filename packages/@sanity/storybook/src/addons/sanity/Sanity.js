import React, {PureComponent, PropTypes} from 'react' // eslint-disable-line no-unused-vars
import addons from '@kadira/storybook-addons'
import extractPropTypes from './extractPropTypes'

export default class Sanity extends PureComponent {
  render() {
    const {children, part, propTables} = this.props
    const channel = addons.getChannel()
    const info = {part, propTypes: extractPropTypes(propTables)}

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
