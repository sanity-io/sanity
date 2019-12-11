import React from 'react'
let uniqueId = 0
const prefix = 'i0GbQLAps1V1E9s3W'
export function useUniqueId() {
  const idRef = React.useRef(`${prefix}-${uniqueId++}`)
  return idRef.current
}
