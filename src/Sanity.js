import React, {Component} from 'react'
import plugins from '@sanity/plugin-loader/plugins'
import DefaultRootComponent from './Components/DefaultRootComponent'
import createSanity from './createSanity'

class Sanity extends Component {
  constructor(props) {
    super(props)

    this.sanity = createSanity({roles: props.roles})
  }

  getChildContext() {
    return {sanity: this.sanity}
  }

  render() {
    const Root = this.sanity.getRole('@sanity/base/rootComponent') || DefaultRootComponent
    return <Root />
  }
}

Sanity.propTypes = {
  roles: React.PropTypes.object // eslint-disable-line react/forbid-prop-types
}

Sanity.defaultProps = {
  roles: plugins
}

export default Sanity
