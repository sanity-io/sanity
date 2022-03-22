import type React from 'react'
import {AvatarSize} from './types'
interface AvatarStackProps {
  children: React.ReactNode
  maxLength?: number
  size?: AvatarSize
  tone?: 'navbar'
}
export declare function AvatarStack(
  props: AvatarStackProps & React.HTMLProps<HTMLDivElement>
): JSX.Element
export {}
