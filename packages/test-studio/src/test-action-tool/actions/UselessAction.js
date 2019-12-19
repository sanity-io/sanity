import React from 'react'
import {createAction} from 'part:@sanity/base/actions/utils'

export default createAction(function UselessButSimpleAction(documentInfo) {
  const [clickCount, setClickCount] = React.useState(0)
  return {
    label: `Count clicks: ${clickCount}`,
    onHandle: () => {
      setClickCount(clickCount + 1)
    }
  }
})
