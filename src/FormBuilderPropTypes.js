import {PropTypes} from 'react'

function lazy(fn) {
  let cachedFn
  return (...args) => (cachedFn || (cachedFn = fn()))(...args)
}

const field = PropTypes.shape({
  name: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  to: lazy(() => PropTypes.arrayOf(field)),
  of: lazy(() => PropTypes.arrayOf(field))
})

const type = PropTypes.shape({
  fields: PropTypes.arrayOf(field),
  alias: PropTypes.string,
  isPrimitive: PropTypes.bool
})

const validation = {
  fields: PropTypes.objectOf(lazy(() => PropTypes.shape(validation))),
  messages: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['error', 'warning']),
    id: PropTypes.string,
    message: PropTypes.string
  }))
}

const schema = PropTypes.objectOf(type)

export default {
  type,
  schema,
  field,
  validation
}
