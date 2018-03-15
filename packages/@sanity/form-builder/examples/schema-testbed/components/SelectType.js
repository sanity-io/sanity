import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/SelectType.css'
import sourceSchemas from '../schemas'

export default class Select extends React.Component {
  static propTypes = {
    params: PropTypes.object
  }
  render() {
    const schemaKeys = Object.keys(sourceSchemas)

    return (
      <div className={styles.root}>
        <h1>Select schema / type</h1>
        <ul className={styles.schema}>
          {schemaKeys.map(schemaName => {
            const schema = sourceSchemas[schemaName]
            return (
              <li key={schemaName} className={styles.schema}>
                <h2>{schemaName}</h2>
                {schemaName !== schema.name && (
                  <span>
                    MISMATCH: {schemaName} !== {schema.name}
                  </span>
                )}
                <ul className={styles.type}>
                  {schema.types.map(type => {
                    return (
                      <li key={type.name} className={styles.type}>
                        <a href={`/${schemaName}/${type.name}`}>{type.name}</a>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}
