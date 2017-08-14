import React, {PropTypes} from 'react'
import Vision from './Vision'
import Button from './compat/Button'
import Dropdown from './components/Dropdown'

const components = {
  Button,
  Select: Dropdown
}

// Used outside of Sanity projects
function InsanityVision(props) {
  return (
    <Vision
      components={components}
      client={props.client}
    />
  )
}

InsanityVision.propTypes = {
  client: PropTypes.shape({
    config: PropTypes.func.isRequired
  }).isRequired
}

module.exports = InsanityVision
