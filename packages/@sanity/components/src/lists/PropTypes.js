import {PropTypes} from 'react'

export const item = PropTypes.shape({
  title: PropTypes.string,
  content: PropTypes.node,
  icon: PropTypes.node
})
