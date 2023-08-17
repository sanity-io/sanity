import React from 'react'
import {Rect} from './types'

export function ClampedRect(
  props: {top: number; left: number; height: number; width: number; bounds: Rect} & Omit<
    React.ComponentProps<'rect'>,
    'top' | 'left' | 'height' | 'width'
  >,
) {
  const {bounds, ...rest} = props
  const x = Math.max(bounds.left, props.left)
  const y = Math.max(props.top, bounds.top)
  const height = Math.max(0, props.height - (y - props.top))
  const width = Math.max(0, props.width - (x - props.left))

  return <rect {...rest} x={x} y={y} height={height} width={width} />
}
