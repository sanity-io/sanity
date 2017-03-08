import React, {PropTypes} from 'react'
import PropVal from './PropVal'
import styles from './styles/PropTable.css'

function PropTable({propTypes}) {
  if (!propTypes || propTypes.length === 0) {
    return null
  }

  return (
    <table className={styles.root}>
      <thead>
        <tr>
          <th className={styles.heading}>Property</th>
          <th className={styles.headingPropType}>PropType</th>
          <th className={styles.headingRequired}>Required</th>
          <th className={styles.headingDefault}>Default</th>
        </tr>
      </thead>
      <tbody>
        {propTypes.map(prop => (
          <tr key={prop.property}>
            <th className={styles.property}>{prop.property}</th>
            <td className={styles.proptype}>{prop.propType}</td>
            <td className={styles.required}>{prop.required ? 'Yes' : 'No'}</td>
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
