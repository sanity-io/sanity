import React from 'react'
import {omit} from 'lodash'

export default function ProductionPreview(props) {
  const {type} = props
  const rest =  omit(props, 'type')
  return (
    <div>
      <h2>This is a custom preview of {type.title}</h2>
      <pre>{JSON.stringify(rest)}</pre>
    </div>
  )
}

ProductionPreview.shouldPreview = function canPreview(type) {
  return type.name === 'author'
}
