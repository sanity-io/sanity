import React from 'react'
import {PreviewAny} from './PreviewAny'

export function PreviewArray(props) {
  const {value, maxDepth, _depth, ...rest} = props

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
