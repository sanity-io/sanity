import PropTypes from 'prop-types'
import React from 'react'
import {ThemePropertyPreview} from './propertyPreview'

import styles from './property.css'

export function ThemeProperty({property}) {
  return (
    <div className={styles.root}>
      <h3 className={styles.label}>
        <code>
          {property.name}: {property.value}
        </code>
      </h3>

      <div className={styles.preview}>
        <ThemePropertyPreview property={property} />
      </div>
    </div>
  )
}

ThemeProperty.propTypes = {
  property: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
}
