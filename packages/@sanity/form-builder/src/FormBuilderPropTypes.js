import PropTypes from 'prop-types'

// todo: fix issue with type being a cicular proptype. Should probably replace all this with flowtypes

function lazy(fn) {
  let cachedFn
  return (...args) => (cachedFn || (cachedFn = fn()))(...args)
}

const field = PropTypes.shape({
  name: PropTypes.string,
  type: PropTypes.object
})

const type = PropTypes.shape({
  name: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  placeholder: PropTypes.string,
  type: lazy(() => type),
  to: lazy(() => PropTypes.arrayOf(type)),
  fields: lazy(() => PropTypes.arrayOf(field)),
  of: lazy(() => PropTypes.arrayOf(type))
})

const schema = PropTypes.shape({
  name: PropTypes.string,
  fields: PropTypes.arrayOf(type)
})

export default {
  type,
  field,
  schema
}
