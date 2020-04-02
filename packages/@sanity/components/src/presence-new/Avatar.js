import React, {useState, useEffect} from 'react'
import userStore from 'part:@sanity/base/user'
import PropTypes from 'prop-types'
import {useId} from '@reach/auto-id'
import colorHasher from '../presence/colorHasher'
import styles from './styles/Avatar.css'

function nameToInitials(fullName) {
  const namesArray = fullName.split(' ')
  if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
}

export default function Avatar({userId, sessionId, position, scrollToField, status, size}) {
  // we need to scope the value of the id attributes here
  const elementId = useId()
  const [user, setUser] = useState({})
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (userId) {
      userStore.getUser(userId).then(result => {
        setUser(result)
        setSrc(result.imageUrl)
      })
    }
  }, [user])

  function handleScrollToField(event) {
    if (scrollToField) {
      scrollToField(event)
    }
  }

  // Decide whether the avatar border should animate
  const isAnimating = !position && status === 'editing'
  // Create a unique color for the user
  const userColor = colorHasher(sessionId || userId)

  return (
    <div
      className={styles.root}
      onClick={handleScrollToField}
      data-dock={position}
      style={{color: userColor}}
      aria-label={user.displayName}
    >
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
              fill={src ? `url(#${`${elementId}_${userId}-image-url`})` : 'currentColor'}
            />
            <defs>
              <pattern
                id={`${elementId}_${userId}-image-url`}
                patternContentUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                {src && <image href={src} width="1" height="1" onError={() => setSrc(null)} />}
              </pattern>
            </defs>
          </svg>
          {user.displayName && !src && (
            <div className={styles.avatarInitials}>{nameToInitials(user.displayName)}</div>
          )}
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
  userId: PropTypes.string.isRequired,
  sessionId: PropTypes.string,
  position: PropTypes.oneOf(['top', 'bottom', null]),
  scrollToField: PropTypes.func,
  size: PropTypes.string,
  status: PropTypes.oneOf(['online', 'editing', 'inactive'])
}

Avatar.defaultProps = {
  position: null,
  scrollToField: null,
  size: 'small',
  status: 'online'
}
