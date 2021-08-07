/// <reference types="react" />
import {Rect} from './types'
interface Props {
  from: {
    rect: Rect
    bounds: Rect
  }
  to: {
    rect: Rect
    bounds: Rect
  }
  hovered: boolean
  revertHovered: boolean
  focused: boolean
}
export declare function Connector({from, to, hovered, focused, revertHovered}: Props): JSX.Element
export {}
