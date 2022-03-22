import {Modifier} from '@popperjs/core'
import type React from 'react'
import {Placement} from '../types'
declare type PopperModifiers = ReadonlyArray<Partial<Modifier<string, unknown>>>
interface PoppableProps {
  onEscape?: () => void
  onClickOutside?: (ev: MouseEvent) => void
  children?: React.ReactNode
  referenceClassName?: string
  referenceElement?: HTMLElement
  placement?: Placement
  positionFixed?: boolean
  popperClassName?: string
  modifiers?: PopperModifiers
}
export default Poppable
declare function Poppable(props: PoppableProps): JSX.Element
