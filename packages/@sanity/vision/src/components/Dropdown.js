import React from 'react'
import PropTypes from 'prop-types'

function Dropdown(props) {
  const {id, value, className, values, onChange} = props
  return (
    <select id={id} className={className} value={value} onChange={onChange}>
      {values.map(val => <option key={val}>{val}</option>)}
    </select>
  )
}

Dropdown.propTypes = {
  id: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string
}

Dropdown.defaultProps = {
  values: []
}

export default Dropdown
