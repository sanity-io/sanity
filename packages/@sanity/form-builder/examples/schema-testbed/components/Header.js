import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Header.css'

function goto(schema, type) {
  document.location.href = `/${[schema, type].filter(Boolean).join('/')}`
}

export default function Header(props) {
  const {schemaNames, typeNames, selectedTypeName, selectedSchemaName} = props
  return (
    <header className={styles.header}>
      Schema:{' '}
      <select value={selectedSchemaName} onChange={e => goto(e.target.value)}>
        {!selectedSchemaName && <option>Select schema…</option>}
        {schemaNames.map(schemaName => (
          <option key={schemaName} value={schemaName}>
            {schemaName}
          </option>
        ))}
      </select>{' '}
      {selectedSchemaName && (
        <span>
          Type:{' '}
          <select
            value={selectedTypeName}
            onChange={e => goto(selectedSchemaName, e.currentTarget.value)}
          >
            {!selectedTypeName && <option>Select type…</option>}
            {typeNames.map(typeName => <option key={typeName}>{typeName}</option>)}
          </select>
        </span>
      )}
    </header>
  )
}

Header.propTypes = {
  schemaNames: PropTypes.arrayOf(PropTypes.string),
  typeNames: PropTypes.arrayOf(PropTypes.string),
  selectedTypeName: PropTypes.string,
  selectedSchemaName: PropTypes.string
}
