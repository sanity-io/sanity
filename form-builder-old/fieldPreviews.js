// Core previews for field values appearing in lists etc.
// May be extended and overidden by a Sanity installation as prop.formBuilderPreviews to FormBuilder.

export default {
  string: require('./previews/String'),
  latlon: require('./previews/LatLon'),
  image: require('./previews/Image'),
  reference: require('./previews/Reference'),
  default: require('./previews/FallbackFieldPreview')
}
