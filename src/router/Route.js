import {PropTypes} from 'react'

// Just a placeholder, never actually rendered
export default function Route() {
  return null
}

Route.propTypes = {
  path: PropTypes.string.isRequired,
  component: PropTypes.func.isRequired
}
