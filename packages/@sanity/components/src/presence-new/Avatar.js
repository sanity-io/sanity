import React from 'react'
import PropTypes from 'prop-types'
import {useId} from '@reach/auto-id'
import styles from './styles/Avatar.css'

export default function Avatar({
  color,
  imageUrl,
  label,
  isAnimating,
  children,
  onImageLoadError,
  position,
  status,
  size
}) {
  const elementId = useId()
  return (
    <div className={styles.root} data-dock={position} style={{color}} aria-label={label}>
      <div className={`${styles.avatar}`} data-status={status} data-size={size}>
        <div className={styles.avatarInner}>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse
              cx="16"
              cy="16"
              rx="15"
              ry="15"
              transform="rotate(90 16 16)"
              stroke="currentColor"
              className={`
                ${styles.border}
                ${isAnimating && styles.isAnimating}
              `}
            />
            <ellipse cx="16" cy="16" rx="14" ry="14" transform="rotate(-90 16 16)" fill="white" />
            <circle
              className={styles.avatarImage}
              cx="16"
              cy="16"
              r="13"
              fill={imageUrl ? `url(#${elementId}-image-url)` : 'currentColor'}
            />
            <defs>
              <pattern
                id={`${elementId}-image-url`}
                patternContentUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                {imageUrl && (
                  <image href={imageUrl} width="1" height="1" onError={onImageLoadError} />
                )}
              </pattern>
            </defs>
          </svg>
          {children && <div className={styles.avatarInitials}>{children}</div>}
        </div>
        <div className={styles.arrow} data-dock={position}>
          <svg viewBox="0 0 10 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 6.4H9.6L5.44 0.853333C5.12 0.426666 4.48 0.426666 4.16 0.853333L0 6.4Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

Avatar.propTypes = {
  color: PropTypes.string,
  imageUrl: PropTypes.string,
  isAnimating: PropTypes.bool,
  position: PropTypes.oneOf(['top', 'bottom', 'inside', null]),
  onClick: PropTypes.func,
  label: PropTypes.string.isRequired,
  children: PropTypes.any,
  onImageLoadError: PropTypes.func,
  size: PropTypes.string,
  status: PropTypes.oneOf(['online', 'editing', 'inactive'])
}

Avatar.defaultProps = {
  size: 'small',
  status: 'online'
}
