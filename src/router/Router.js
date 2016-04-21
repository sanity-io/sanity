import React, {PropTypes} from 'react'
import HttpHash from 'http-hash'

export default function Router({children, location}) {

  const hash = HttpHash()

  const routes = React.Children.map(children, child => {
    const {path, component} = child.props
    return {path, component}
  })

  routes.forEach(route => hash.set(route.path, route.component))

  const match = hash.get(location.pathname)

  return match ? React.createElement(match.handler, {
    location,
    params: match.params,
    splat: match.splat
  }) : null
}

Router.propTypes = {
  location: PropTypes.shape({}),
  children: PropTypes.node
}
