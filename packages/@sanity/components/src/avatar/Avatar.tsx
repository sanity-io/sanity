import {useId} from '@reach/auto-id'
import React, {useCallback, useEffect, useState} from 'react'
import {AvatarPosition, AvatarStatus, AvatarSize} from './types'

import styles from './Avatar.css'

export interface AvatarProps {
  color: {
    dark: string
    light: string
  }
  src?: string
  title?: string
  initials?: string
  onImageLoadError?: (event: Error) => void
  arrowPosition?: AvatarPosition
  animateArrowFrom?: AvatarPosition
  status?: AvatarStatus
  size?: AvatarSize
  tone?: 'navbar'
}

const SVG_SIZE = 23
const SVG_RADIUS = SVG_SIZE / 2

export function Avatar(props: AvatarProps) {
  const {
    color = {
      dark: 'currentColor',
      light: 'currentColor'
    },
    src,
    title,
    initials,
    onImageLoadError,
    arrowPosition: arrowPositionProp,
    animateArrowFrom,
    status = 'online',
    size = 'small',
    tone
  } = props

  const backgroundColor = tone === 'navbar' ? color.dark : color.light

  const elementId = useId()
  const [arrowPosition, setArrowPosition] = useState<AvatarPosition | undefined>(
    animateArrowFrom || arrowPositionProp || 'inside'
  )

  const [imageFailed, setImageFailed] = useState<boolean>(false)

  useEffect(() => {
    if (arrowPosition === arrowPositionProp) return undefined

    // Start animation in the next frame
    const raf = requestAnimationFrame(() => setArrowPosition(arrowPositionProp))

    return () => cancelAnimationFrame(raf)
  }, [arrowPosition, arrowPositionProp])

  useEffect(() => {
    if (src) setImageFailed(false)
  }, [src])

  const handleImageError = useCallback(() => {
    setImageFailed(true)

    if (onImageLoadError) {
      onImageLoadError(new Error('Avatar: the image failed to load'))
    }
  }, [onImageLoadError])

  return (
    <div
      aria-label={title}
      className={styles.root}
      data-arrow-position={arrowPosition}
      data-size={size}
      data-status={status}
      data-tone={tone}
      style={{backgroundColor}}
      title={title}
    >
      <div className={styles.arrow}>
        <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
          <path
            d="M6.67948 1.50115L11 7L0 7L4.32052 1.50115C4.92109 0.736796 6.07891 0.736795 6.67948 1.50115Z"
            fill={backgroundColor}
          />
        </svg>
      </div>

      <div className={styles.inner}>
        {!imageFailed && src && (
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`${elementId}-image-url`}
                patternContentUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                <image href={src} width="1" height="1" onError={handleImageError} />
              </pattern>
            </defs>

            <circle
              cx={SVG_RADIUS}
              cy={SVG_RADIUS}
              r={SVG_RADIUS}
              fill={`url(#${elementId}-image-url)`}
            />

            <ellipse
              className={styles.bgStroke}
              cx={SVG_RADIUS}
              cy={SVG_RADIUS}
              rx={SVG_RADIUS}
              ry={SVG_RADIUS}
            />

            <ellipse
              className={styles.stroke}
              cx={SVG_RADIUS}
              cy={SVG_RADIUS}
              rx={SVG_RADIUS}
              ry={SVG_RADIUS}
              stroke={backgroundColor}
            />
          </svg>
        )}

        {(imageFailed || !src) && initials && (
          <div className={styles.initials}>
            <span>{initials}</span>
          </div>
        )}
      </div>
    </div>
  )
}
