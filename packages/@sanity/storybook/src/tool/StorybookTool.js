import React from 'react'
import config from 'config:@sanity/storybook'

const styles = {
  border: 0,
  width: '100%',
  height: '100%',
}

export default function StorybookTool(props) {
  return (
    <iframe
      src={`http://localhost:${config.port}/`}
      style={styles}
    />
  )
}
