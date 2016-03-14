import React, {Component} from 'react'
import DefaultRootComponent from './DefaultRootComponent'
import createSanity, {sanityShape} from '../createSanity'

class Sanity extends Component {
  getChildContext() {
    return {sanity: this.sanity}
  }

  componentWillMount() {
    this.initSanity(this.props)
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.roles !== this.props.roles
  }

  componentWillUpdate(nextProps) {
    this.initSanity(nextProps)
  }

  initSanity(props) {
    this.sanity = createSanity({roles: props.roles})
  }

  render() {
    const Root = this.sanity.getRole('@sanity/base/rootComponent') || DefaultRootComponent
    return <Root />
  }
}

Sanity.childContextTypes = sanityShape

Sanity.propTypes = {
  roles: React.PropTypes.object.isRequired // eslint-disable-line react/forbid-prop-types
}

export default Sanity
