import React, {useState, useEffect} from 'react'
import {useId} from '@reach/auto-id'
import styles from './AvatarCircle.css'
import {Position, Status, Size} from './types'

type Props = {
  borderColor: string
  fillColor?: string
  showFill?: boolean
  imageUrl?: string
  label: string
  isAnimating?: boolean
  children?: React.ReactNode
  onImageLoadError?: (event: Error) => void
  position?: Position
  status?: Status
  size?: Size
}

export default function AvatarCircle({
  borderColor = 'currentColor',
  fillColor = 'white',
  showFill = true,
  imageUrl,
  label,
  isAnimating = false,
  children,
  onImageLoadError,
  position = 'inside',
  status = 'online',
  size = 'small'
}: Props) {
  const elementId = useId()
  const [arrowPosition, setArrowPosition] = useState('inside')

  useEffect(() => {
    const arrowTimer = setTimeout(() => {
      setArrowPosition(position)
    }, 50)
    return () => {
      clearTimeout(arrowTimer)
    }
  }, [])

  return (
    <div className={styles.root} data-dock={arrowPosition} aria-label={label} title={label}>
      <div className={`${styles.avatar}`} data-status={status} data-size={size}>
        <div className={styles.avatarInner}>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse
              data-avatar-border
              cx="16"
              cy="16"
              rx="15"
              ry="15"
              transform="rotate(90 16 16)"
              stroke={borderColor}
              className={`
                ${styles.border}
                ${isAnimating && styles.isAnimating}
              `}
            />
            <ellipse
              data-avatar-fill
              cx="16"
              cy="16"
              rx="14"
              ry="14"
              transform="rotate(-90 16 16)"
              fill={fillColor}
            />
            <circle
              data-avatar-image
              cx="16"
              cy="16"
              r={showFill ? 13 : 14.2}
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
                  <image
                    href={imageUrl}
                    width="1"
                    height="1"
                    onError={() => onImageLoadError(new Error('Image failed to load'))}
                  />
                )}
              </pattern>
            </defs>
          </svg>
          {children && <div className={styles.avatarInitials}>{children}</div>}
        </div>
        <div className={styles.arrow} data-dock={arrowPosition}>
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
