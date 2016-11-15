export default function fallbackPreviewProps(value) {
  const _value = Object.assign({}, (value || {}))

  // Remove all keys from value that begins with '_'
  // to only deal with actual input values
  Object.keys(_value)
    .filter(key => key.charAt(0) === '_')
    .forEach(key => {
      delete _value[key]
    })
  const props = {}

  // Try to figure out a title for the preview

  // Try the obvious candidates
  const titleProps = ['title', 'name', 'heading', 'header', 'slug', 'caption']
  titleProps.forEach(prop => {
    if (_value[prop] && !props.title) {
      props.title = _value[prop]
    }
  })

  // Use first property value
  if (!props.title && Object.keys(_value).length) {
    let firstPropValue = _value[Object.keys(_value)[0]]
    if (typeof firstPropValue !== 'string') {
      firstPropValue = JSON.stringify(firstPropValue)
    }
    props.title = firstPropValue
  }

  return props
}
