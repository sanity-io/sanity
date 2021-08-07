/// <reference types="react" />
import {AvatarPosition, AvatarStatus, AvatarSize} from './types'
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
export declare function Avatar(props: AvatarProps): JSX.Element
