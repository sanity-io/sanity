import {PropTypes} from 'react'

const PropTypesMap = new Map()
for (const typeName in PropTypes) {
  if (!PropTypes.hasOwnProperty(typeName)) {
    continue
  }

  const type = PropTypes[typeName]
  PropTypesMap.set(type, typeName)
  PropTypesMap.set(type.isRequired, typeName)
}

function extractProps(component) {
  const propTypes = component.propTypes || {}
  const defaultProps = component.defaultProps || {}

  const properties = Object.keys(propTypes).reduce((props, property) => {
    const typeInfo = propTypes[property]
    const propType = PropTypesMap.get(typeInfo) || 'other'
    const required = typeInfo.isRequired === undefined
    const defaultValue = defaultProps[property]
    return Object.assign(props, {[property]: {property, propType, required, defaultValue}})
  }, {})

  return Object.keys(properties).sort().map(property => properties[property])
}

function extractPropsForComponents(components) {
  if (!components || components.length === 0) {
    return {}
  }

  const sorted = components.slice().sort((compA, compB) => {
    return (compA.displayName || compA.name) > (compB.displayName || compB.name)
  })

  return sorted.map(component => ({
    name: component.displayName || component.name,
    props: extractProps(component)
  }))
}

export default extractPropsForComponents
