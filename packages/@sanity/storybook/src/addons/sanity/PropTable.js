import React, {PropTypes} from 'react'
import PropVal from './PropVal'

const stylesheet = {
  propTable: {
    marginLeft: -10,
    borderSpacing: '10px 5px',
    borderCollapse: 'separate',
  },
}

function PropTable({propTypes}) {
  if (!propTypes || propTypes.length === 0) {
    return null
  }

  return (
    <table style={stylesheet.propTable}>
      <thead>
        <tr>
          <th>property</th>
          <th>propType</th>
          <th>required</th>
          <th>default</th>
        </tr>
      </thead>
      <tbody>
        {propTypes.map(prop => (
          <tr key={prop.property}>
            <td>{prop.property}</td>
            <td>{prop.propType}</td>
            <td>{prop.required ? 'Yes' : 'No'}</td>
            <td>{prop.defaultValue === undefined ? '-' : <PropVal val={prop.defaultValue} />}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

PropTable.displayName = 'PropTable'
PropTable.propTypes = {
  propTypes: PropTypes.arrayOf(PropTypes.shape({
    property: PropTypes.string.isRequired,
    propType: PropTypes.string.isRequired,
    required: PropTypes.bool.isRequired,
    defaultValue: PropTypes.any
  }))
}

export default PropTable
