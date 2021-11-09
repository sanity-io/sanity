import PropTypes from 'prop-types'
import React from 'react'

import styles from './propertyPreview.css'

// eslint-disable-next-line complexity
export function ThemePropertyPreview({property}) {
  if (property.type === 'color') {
    return (
      <div
        className={styles.root}
        data-type={property.type}
        style={{background: property.value, height: '2.5em'}}
      />
    )
  }

  if (property.type === 'size') {
    return <div className={styles.root} data-type={property.type} style={{width: property.value}} />
  }

  if (property.type === 'font-family') {
    return (
      <div className={styles.root} data-type={property.type} style={{fontFamily: property.value}}>
        Hamburgefonstiv
      </div>
    )
  }

  if (property.type === 'font-size') {
    return (
      <div className={styles.root} data-type={property.type} style={{fontSize: property.value}}>
        Hamburgefonstiv
      </div>
    )
  }

  if (property.type === 'font-weight') {
    return (
      <div className={styles.root} data-type={property.type} style={{fontWeight: property.value}}>
        Hamburgefonstiv
      </div>
    )
  }

  if (property.type === 'z-index') {
    // no preview
    return null
  }

  if (property.type === 'border-radius') {
    return (
      <div className={styles.root} data-type={property.type}>
        <div style={{borderTopLeftRadius: property.value}} />
      </div>
    )
  }

  if (property.type === 'cursor') {
    return (
      <div className={styles.root} data-type={property.type} style={{cursor: property.value}}>
        Hover me
      </div>
    )
  }

  if (property.type === 'border-width') {
    return (
      <div className={styles.root} data-type={property.type}>
        <div style={{borderTop: `${property.value} solid #000`}} />
      </div>
    )
  }

  if (property.type === 'border') {
    return (
      <div className={styles.root} data-type={property.type}>
        <div style={{borderTop: property.value}} />
      </div>
    )
  }

  if (property.type === 'line-height') {
    return (
      <div className={styles.root} data-type={property.type} style={{lineHeight: property.value}}>
        Hamburgefonstiv
      </div>
    )
  }

  if (property.type === 'box-shadow') {
    return (
      <div className={styles.root} data-type={property.type} style={{boxShadow: property.value}} />
    )
  }

  return (
    <>
      <div className={styles.unknown}>
        Unknown var type: <code>{property.type}</code>
      </div>
    </>
  )
}

ThemePropertyPreview.propTypes = {
  property: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
}
