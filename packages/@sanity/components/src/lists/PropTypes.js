import PropTypes from 'prop-types'

export const item = PropTypes.shape({
  title: PropTypes.string,
  content: PropTypes.node,
  icon: PropTypes.node
})
