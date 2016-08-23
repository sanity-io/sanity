import React, {PropTypes} from 'react'
import {resolveJSType} from '../../types/utils'
import styles from './styles/FallbackPreviewComponent.css'
import SanityPreview from 'component:@sanity/components/previews/default' // eslint-disable-line

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

function resolvePreviewPath(fieldName, value) {
  const fieldValue = value.value[fieldName] && value.value[fieldName].value
  const type = resolveJSType(fieldValue)

  if (fieldName && type == 'array') {
    return fieldValue.join(', ')
  }

  return fieldValue
}

function render(value, fieldType, field) {
  const type = resolveJSType(value)
  if (type === 'object') {
    if (resolveJSType(value.serialize) === 'function') {
      return render(value.serialize())
    }
    return renderObject(value)
  }
  if (type === 'array') {
    return renderArray(value)
  }
  return renderPrimitive(value)
}

export default function FallbackPreviewComponent(props) {

  // Preview defined in schema
  if (props.type.options && props.type.options.preview) {
    const preview = props.type.options.preview
    return (<SanityPreview
      title={resolvePreviewPath(preview.title, props.value)}
      subtitle={resolvePreviewPath(preview.subtitle, props.value)}
      description={resolvePreviewPath(preview.description, props.value)}
      emptyText={preview.emptyText}
      sanityImage={false}
      />
    )
  }

  return (
    <div className={styles.root}>
      {render(props.value, props.type, props.field) || <pre>[{props.field.type}: {JSON.stringify(props.value)}]</pre>}
    </div>
  )
}

FallbackPreviewComponent.propTypes = {
  value: PropTypes.any.isRequired,
  field: PropTypes.object.isRequired,
  type: PropTypes.object.isRequired,
  options: PropTypes.object
}
