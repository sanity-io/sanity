import {PropTypes} from 'react'

function lazy(fn) {
  let cachedFn
  return (...args) => (cachedFn || (cachedFn = fn()))(...args)
}

const field = PropTypes.shape({
  name: PropTypes.string,
  type: type
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

const validation = {
  fields: PropTypes.objectOf(lazy(() => PropTypes.shape(validation))),
  messages: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['error', 'warning']),
    id: PropTypes.string,
    message: PropTypes.string
  }))
}

const schema = PropTypes.shape({
  name: PropTypes.string,
  fields: PropTypes.arrayOf(type)
})

export default {
  type,
  field,
  schema,
  validation
}
