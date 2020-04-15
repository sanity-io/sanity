import React, {useState, useEffect} from 'react'
import userStore from 'part:@sanity/base/user'
import PropTypes from 'prop-types'
import colorHasher from '../presence/colorHasher'
import Avatar from './Avatar'

function nameToInitials(fullName) {
  const namesArray = fullName.split(' ')
  if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
}

export default function AvatarProvider({userId, sessionId, position, scrollToField, status, size}) {
  // we need to scope the value of the id attributes here
  const [user, setUser] = useState({})
  const [imageLoadError, setImageLoadError] = useState(false)
  useEffect(() => {
    if (userId) {
      userStore.getUser(userId).then(result => {
        setUser(result)
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

  const imageUrl = imageLoadError ? null : user?.imageUrl
  return (
    <Avatar
      imageUrl={imageUrl}
      isAnimating={isAnimating}
      position={position}
      size={size}
      label={user.displayName}
      color={userColor}
      onClick={handleScrollToField}
      onImageLoadError={error => setImageLoadError(error)}
    >
      {!imageUrl && user?.displayName && nameToInitials(user.displayName)}
    </Avatar>
  )
}

AvatarProvider.propTypes = {
  userId: PropTypes.string.isRequired,
  sessionId: PropTypes.string,
  position: PropTypes.oneOf(['top', 'bottom', null]),
  scrollToField: PropTypes.func,
  size: PropTypes.string,
  status: PropTypes.oneOf(['online', 'editing', 'inactive'])
}

AvatarProvider.defaultProps = {
  size: 'small',
  status: 'online'
}
