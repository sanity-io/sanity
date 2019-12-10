import React from 'react'
import {createAction} from 'part:@sanity/base/util/document-action-utils'


export default createAction(function UselessButSimpleAction(documentInfo) {
  const [clickCount, setClickCount] = React.useState(0)
  return {
    label: `Count clicks: ${clickCount}`,
    handle: () => {
      setClickCount(clickCount + 1)
    }
  }
})
