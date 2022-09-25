import React from 'react'
import {Rect} from './types'

export function DebugLayers({
  field,
  change,
}: {
  field: {rect: Rect; bounds: Rect}
  change: {rect: Rect; bounds: Rect}
}) {
  return (
    <g style={{pointerEvents: 'none'}}>
      <rect
        x={field.bounds.left}
        y={field.bounds.top}
        height={field.bounds.height}
        width={field.bounds.width}
        stroke="green"
        fill="none"
        strokeWidth={1}
      />
      <rect
        x={field.rect.left}
        y={field.rect.top}
        height={field.rect.height}
        width={field.rect.width}
        stroke="black"
        fill="none"
        strokeWidth={1}
      />
      <rect
        x={change.bounds.left}
        y={change.bounds.top}
        height={change.bounds.height}
        width={change.bounds.width}
        stroke="crimson"
        fill="none"
        strokeWidth={1}
      />
      <rect
        x={change.rect.left}
        y={change.rect.top}
        height={change.rect.height}
        width={change.rect.width}
        stroke="black"
        fill="none"
        strokeWidth={1}
      />
    </g>
  )
}
