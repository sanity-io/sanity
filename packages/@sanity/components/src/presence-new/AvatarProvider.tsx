import React, {useState, useEffect} from 'react'
import userStore from 'part:@sanity/base/user'
import Avatar from './Avatar'
import {nameToInitials} from './helpers'
import {Position, Status, User} from './types'

export type Props = {
  userId: string
  color: string
  position?: Position
  status: Status
  size: 'small' | 'medium'
}

export default function AvatarProvider({
  userId,
  position,
  color,
  status = 'online',
  size = 'small'
}: Props) {
  // we need to scope the value of the id attributes here
  const [user, setUser] = useState<User | null>(null)
  const [imageLoadError, setImageLoadError] = useState<null | Error>(null)
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

  const imageUrl = imageLoadError ? null : user?.imageUrl
  return (
    <Avatar
      imageUrl={imageUrl}
      isAnimating={isAnimating}
      position={position}
      size={size}
      label={user?.displayName}
      color={color}
      onImageLoadError={error => setImageLoadError(error)}
    >
      {!imageUrl && user?.displayName && nameToInitials(user.displayName)}
    </Avatar>
  )
}
