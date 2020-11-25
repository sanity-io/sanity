import {Rect} from './types'
import React from 'react'
export declare function ClampedRect(
  props: {
    top: number
    left: number
    height: number
    width: number
    bounds: Rect
  } & Omit<React.ComponentProps<'rect'>, 'top' | 'left' | 'height' | 'width'>
): JSX.Element
