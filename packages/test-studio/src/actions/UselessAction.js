import React from 'react'

export default function UselessButSimpleAction(documentInfo) {
  const [clickCount, setClickCount] = React.useState(0)
  return {
    label: `Count clicks: ${clickCount}`,
    handle: () => {
      setClickCount(clickCount + 1)
    }
  }
}
