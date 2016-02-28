
import {PropTypes} from 'react'

const FieldPropTypes = PropTypes.shape({
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
})


export {FieldPropTypes}