import type React from 'react'
import {TooltipPlacement} from './types'
export interface TooltipProps {
  children?: React.ReactElement
  className?: string
  content: React.ReactNode
  disabled?: boolean
  placement?: TooltipPlacement
  portal?: boolean
  tone?: 'navbar'
  allowedAutoPlacements?: TooltipPlacement[]
  fallbackPlacements?: TooltipPlacement[]
}
export declare function Tooltip(
  props: TooltipProps & Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'content'>
): JSX.Element
