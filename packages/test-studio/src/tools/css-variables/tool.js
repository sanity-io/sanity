import React from 'react'
import {files} from './metadata'
import {CSSVariablesTable} from './table'

import styles from './tool.css'

function CSSVariablesTool() {
  return (
    <div className={styles.root}>
      <div>
        {files.map(file => (
          <CSSVariablesTable key={file.name} name={file.name} vars={file.vars} />
        ))}
      </div>
    </div>
  )
}

export default {
  title: 'CSS variables',
  name: 'css-variables',
  component: CSSVariablesTool
}
