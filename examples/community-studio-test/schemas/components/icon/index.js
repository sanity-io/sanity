import React from 'react'
import PropTypes from 'prop-types'

const Icon = ({emoji, badge, alert}) =>
  typeof emoji === 'string' ? (
    <span style={{
      fontSize: '1.5rem',
      marginRight: '0.3rem',
      paddingRight: '0.2rem'
    }}>
      {emoji}
      {badge !== undefined && badge >= 0 ?
        <span style={{
          backgroundColor: alert ? '#FFE2DE' : '#EAEAEA',
          borderRadius: '8px',
          boxSizing: 'border-box',
          color: alert ? '#F34831' : '#6A6A6A',
          display: 'flex',
          fontSize: '11px',
          fontWeight: '600',
          height: '16px',
          justifyContent: 'center',
          lineHeight: '16px',
          padding: '0 4px 0',
          position: 'absolute',
          right: '0',
          top: '0',
          minWidth: '16px'
        }}>
          {badge}
        </span>
        : ''
      }
    </span>
  ) : (
    <span style={{fontSize: '1.5rem'}}></span>
  )

Icon.propTypes = {
  emoji: PropTypes.string.isRequired
}

export default Icon
