import React from 'react'
import config from 'config:sanity'

export default function Storybook() {
  const storyConfig = config.storybook
  if (!storyConfig) {
    return <h1>`sanity.json` doesn't contain a `storybook` entry</h1>
  }

  const host = storyConfig.hostname || 'localhost'
  const port = storyConfig.port || 9001
  const url = `http://${host}:${port}/`

  // Inline styles to prevent "flash of unstyled content"
  const styles = {
    border: 0,
    margin: 0,
    padding: 0,
    position: 'fixed',
    width: '100%',
    height: '100%'
  }

  return <iframe style={styles} src={url} />
}
