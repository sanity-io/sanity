import React, {useState, useEffect} from 'react'
import userStore from 'part:@sanity/base/user'
import colorHasher from '../presence/colorHasher'
import Avatar from './Avatar'
import {nameToInitials} from './helpers'
import {Position, Status, User} from './types'

export type Props = {
  userId:  string
  sessionId: string
  position: Position
  status: Status
  size: 'small' | 'medium'
}

export default function AvatarProvider({userId, sessionId, position, status, size}: Props){
  // we need to scope the value of the id attributes here
  const [user, setUser] = useState<User | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  useEffect(() => {
    if (userId) {
      // Fetch the user information from the user store
      userStore.getUser(userId).then(result => {
        setUser(result)
      })
    }
  }, [user])

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
      label={user?.displayName}
      color={userColor}
      onImageLoadError={error => setImageLoadError(error)}
    >
      {!imageUrl && user?.displayName && nameToInitials(user.displayName)}
    </Avatar>
  )
}

AvatarProvider.defaultProps = {
  size: 'small',
  status: 'online'
} as Partial<Props>;
