import PropTypes from 'prop-types'
import React from 'react'
import {ThemeProperty} from './property'

import styles from './propertyGroup.css'

export function ThemePropertyGroup({group}) {
  return (
    <details className={styles.root} open>
      <summary>{group.name}</summary>

      {group.properties.map((item) => {
        return <ThemeProperty key={item.name} property={item} />
      })}
    </details>
  )
}

ThemePropertyGroup.propTypes = {
  group: PropTypes.shape({
    name: PropTypes.string.isRequired,
    properties: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
}
