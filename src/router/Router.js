import React, {PropTypes} from 'react'
import HttpHash from 'http-hash'

const Handle404 = props => {
  return <div>Not found: {props.location.pathname}</div>
}

export default class Router extends React.Component {

  getChildContext() {
    const getBasePath = this.getBasePath.bind(this)
    return {
      parentRouter: {
        location: this.props.location,
        params: this.props.params,
        splat: this.props.splat,
        getBasePath: getBasePath,
        urlTo: path => getBasePath() + path
      }
    }
  }

  getBasePath() {
    const {parentRouter} = this.context
    const {location} = this.props
    if (parentRouter) {
      return `${parentRouter.getBasePath()}/${location.pathname}` // todo: fix double-slash issues by treating paths as arrays
    }
    return location.pathname
  }

  render() {
    const {location, children} = this.props

    if (!children) {
      return null
    }

    const hash = HttpHash()
    const routes = React.Children.map(children, child => {
      const {path, component} = child.props
      return {path, component}
    })

    routes.forEach(route => hash.set(route.path, route.component))

    const matchLocation = location.pathname

    const match = hash.get(matchLocation)

    return match.handler ? React.createElement(match.handler, {
      location,
      params: match.params,
      splat: match.splat
    }) : React.createElement(Handle404, {
      location
    })
  }
}

const locationType = PropTypes.shape({
  pathname: PropTypes.string
})
const parentRouterType = PropTypes.shape({
  location: locationType,
  splat: PropTypes.string,
  params: PropTypes.object,
  getBasePath: PropTypes.func,
  urlTo: PropTypes.func
})

Router.defaultProps = {basePath: ''}

Router.childContextTypes = {
  parentRouter: parentRouterType
}

Router.contextTypes = {
  parentRouter: parentRouterType
}

Router.propTypes = {
  basePath: PropTypes.string,
  location: locationType,
  children: PropTypes.node
}
