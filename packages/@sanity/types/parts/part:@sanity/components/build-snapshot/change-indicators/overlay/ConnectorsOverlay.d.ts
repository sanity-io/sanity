import React from 'react'
import {Path} from '@sanity/types'
export interface Rect {
  height: number
  width: number
  top: number
  left: number
}
interface Props {
  rootRef: HTMLDivElement
  onSetFocus: (nextFocusPath: Path) => void
}
export declare const ConnectorsOverlay: React.NamedExoticComponent<Props>
export {}
