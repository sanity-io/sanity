import React, {useState} from 'react'
import AvatarCircle from './AvatarCircle'
import {Position, Size, Status, PresentUser} from './types'
import {User} from './types'

export type Props = {
  user: User
  color?: string
  fillColor?: string
  position?: Position
  status?: Status
  size?: Size
  showFill?: boolean
}

function nameToInitials(fullName: string) {
  const namesArray = fullName.split(' ')
  if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
}

export default function UserAvatar({
  user,
  position,
  color,
  fillColor,
  showFill,
  status = 'online',
  size
}: Props) {
  const [imageLoadError, setImageLoadError] = useState<null | Error>(null)
  // Decide whether the avatar border should animate
  const isAnimating = !position && status === 'editing'
  // Create a unique color for the user
  const userColor = color || /* colorHasher(userId) */ 'currentColor'
  const imageUrl = imageLoadError ? null : user?.imageUrl
  return (
    <AvatarCircle
      imageUrl={imageUrl}
      isAnimating={isAnimating}
      position={position}
      size={size}
      label={user?.displayName}
      borderColor={userColor}
      fillColor={fillColor}
      onImageLoadError={error => setImageLoadError(error)}
      showFill={showFill}
    >
      {!imageUrl && user?.displayName && nameToInitials(user.displayName)}
    </AvatarCircle>
  )
}
