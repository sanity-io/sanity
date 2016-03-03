import {PropTypes} from 'react'

function lazy(fn) {
  let cachedFn
  return (...args) => (cachedFn || (cachedFn = fn()))(...args)
}

let type

const field = PropTypes.shape({
  title: PropTypes.string,
  description: PropTypes.string,
  placeholder: PropTypes.string,
  type: lazy(() => type),
  to: lazy(() => PropTypes.arrayOf(field)),
  of: lazy(() => PropTypes.arrayOf(field))
})

type = PropTypes.shape({
  fields: PropTypes.objectOf(field),
  alias: PropTypes.string,
  isPrimitive: PropTypes.bool
})

const schema = PropTypes.objectOf(type)

export default {
  type,
  schema,
  field
}
