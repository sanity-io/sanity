import classNames from 'classnames'
import React, {useState, useEffect} from 'react'
import {useId} from '@reach/auto-id'
import styles from './AvatarCircle.css'
import {Position, Status, Size} from './types'

type Props = {
  borderColor: string
  imageUrl?: string
  label: string
  isAnimating?: boolean
  children?: React.ReactNode
  onImageLoadError?: (event: Error) => void
  position?: Position
  animateArrowFrom?: Position
  status?: Status
  size?: Size
  tone?: 'navbar'
}

const W = 21
const H = 21

export default function AvatarCircle({
  borderColor = 'currentColor',
  imageUrl,
  label,
  isAnimating = false,
  children,
  onImageLoadError,
  position = 'inside',
  animateArrowFrom,
  status = 'online',
  size = 'small',
  tone
}: Props) {
  const elementId = useId()
  const [arrowPosition, setArrowPosition] = useState(animateArrowFrom || position)

  useEffect(() => {
    const arrowTimer = setTimeout(() => {
      setArrowPosition(position)
    }, 50)
    return () => {
      clearTimeout(arrowTimer)
    }
  }, [position])

  return (
    <div
      className={styles.root}
      data-dock={arrowPosition}
      data-tone={tone}
      aria-label={label}
      title={label}
    >
      <div className={styles.avatar} data-status={status} data-size={size}>
        <div className={styles.arrow} data-dock={arrowPosition}>
          <svg viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.67948 1.50115L11 7L0 7L4.32052 1.50115C4.92109 0.736796 6.07891 0.736795 6.67948 1.50115Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className={styles.avatarInner}>
          <svg viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse
              data-avatar-border
              cx={W / 2}
              cy={H / 2}
              rx={W / 2 - 1}
              ry={H / 2 - 1}
              transform={`rotate(90 ${W / 2} ${H / 2})`}
              stroke={borderColor}
              className={classNames(styles.border, isAnimating && styles.isAnimating)}
            />
            {imageUrl && (
              <ellipse
                className={styles.backgroundFill}
                data-avatar-fill
                cx={W / 2}
                cy={H / 2}
                rx={W / 2 - 2}
                ry={H / 2 - 2}
                transform={`rotate(90 ${W / 2} ${H / 2})`}
              />
            )}
            <circle
              data-avatar-image
              cx={W / 2}
              cy={H / 2}
              r={W / 2 - (imageUrl ? 2 : 0)}
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
      </div>
    </div>
  )
}
