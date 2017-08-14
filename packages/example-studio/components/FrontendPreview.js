import React from 'react'
import {omit} from 'lodash'

export default function FrontendPreview(props) {
  const {type} = props
  const rest =  omit(props, 'type')
  return (
    <div>
      <h2>This is a custom preview of {type.title}</h2>
      <pre>{JSON.stringify(rest, null, 2)}</pre>
    </div>
  )
}

FrontendPreview.shouldPreview = function canPreview(type) {
  return type.name === 'author'
}
