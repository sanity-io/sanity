import React from 'react'
import {capitalize} from 'lodash'
import {PreviewAny} from './PreviewAny'

export function PreviewObject(props) {
  const {value, maxDepth, _depth, ...rest} = props
  const {_type, _key, ...restValue} = value
  const keys = Object.keys(restValue)
  if (_depth >= maxDepth) {
    return <span>{capitalize(_type || 'object')} {`{${keys.join(', ')}}`}</span>
  }
  return (
    <div>
      {_type && <h3><em>{capitalize(_type)}</em>:</h3>}
      <ul>
        {keys
          .map(key => (
            <li>
              <b>{key}</b>: <PreviewAny {...rest} value={restValue[key]} _depth={_depth + 1} maxDepth={maxDepth} />
            </li>
          ))}
      </ul>
    </div>
  )
}
