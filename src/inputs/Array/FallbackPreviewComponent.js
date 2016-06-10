import React, {PropTypes} from 'react'
import {resolveJSType} from '../../types/utils'

function renderPrimitive(value) {
  return value
}

const GUESS_PROPERTIES = 'title,name,label'.split(',')
function renderObject(value) {
  const objectProperties = Object.keys(value)
  const displayProperty = objectProperties.find(key => GUESS_PROPERTIES.includes(key))
  if (displayProperty) {
    return value[displayProperty]
  }
  return objectProperties
    .filter(key => !key.startsWith('$'))
    .slice(2)
    .map(key => {
      return `${key}: ${render(value[key])}`
    })
    .join('\n')
}

function renderArray(array) {
  return array.map(render).join(', ')
}

function render(value) {
  if (resolveJSType(value.serialize) === 'function') {
    return render(value.serialize())
  }
  const type = resolveJSType(value)
  if (type === 'object') {
    return renderObject(value)
  }
  if (type === 'array') {
    return renderArray(value)
  }
  return renderPrimitive(value)
}

export default function FallbackPreviewComponent(props) {
  return (
    <div>
      {render(props.value)}
    </div>
  )
}

FallbackPreviewComponent.propTypes = {
  value: PropTypes.any.isRequired,
  field: PropTypes.object.isRequired,
  type: PropTypes.object.isRequired
}
