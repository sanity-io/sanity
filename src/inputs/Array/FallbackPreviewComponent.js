import React, {PropTypes} from 'react'

export default function FallbackPreviewComponent(props) {
  return (
    <div><pre>{JSON.stringify(props.value, null, 2)}</pre></div>
  )
}

FallbackPreviewComponent.propTypes = {
  value: PropTypes.any.isRequired,
  field: PropTypes.object.isRequired,
  type: PropTypes.object.isRequired
}
