import React from 'react'

// Used when no login provider is found
const NoLogin = props => {
  return <div>{props.children}</div>
}

NoLogin.propTypes = {
  children: React.PropTypes.node
}

export default NoLogin
