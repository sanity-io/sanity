/// <reference types="react" />
import {AvatarSize} from './types'
interface AvatarCounterProps {
  count: number
  size?: AvatarSize
  tone?: 'navbar'
}
export declare function AvatarCounter({count, size, tone}: AvatarCounterProps): JSX.Element
export {}
