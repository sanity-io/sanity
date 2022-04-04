import React from 'react'
import {PreviewAny} from './PreviewAny'
type Props = {
  value: Array<any>
  maxDepth?: number
  _depth?: number
}
export function PreviewArray(props: Props) {
  const {value, maxDepth = 4, _depth = 0, ...rest} = props
  if (_depth >= maxDepth) {
    return <span>Array({value.length})</span>
  }
  return (
    <ul>
      {value.map((item, i) => {
        return (
          <li key={i}>
            <PreviewAny {...rest} value={item} _depth={_depth + 1} maxDepth={maxDepth} />
          </li>
        )
      })}
    </ul>
  )
}
