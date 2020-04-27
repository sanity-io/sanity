import React, {useState, useEffect} from 'react'
import userStore from 'part:@sanity/base/user'
import Avatar from './Avatar'
import {Position, Status, User, Size} from './types'
import colorHasher from './colorHasher'

export type Props = {
  userId: string
  color?: string
  position?: Position
  status: Status
  size: Size
}

function nameToInitials(fullName: string) {
  const namesArray = fullName.split(' ')
  if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
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
  const userColor = /* color || colorHasher(userId) */ 'currentColor'
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
