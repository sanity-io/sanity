import PropTypes from 'prop-types'
import React from 'react'
import history from './history'

function go(event) {
  event.preventDefault()
  history.push(event.currentTarget.pathname)
}

export default function Link(props) {
  return <a {...props} onClick={go} data-url={props.href} />
}

Link.propTypes = {
  href: PropTypes.string,
}
