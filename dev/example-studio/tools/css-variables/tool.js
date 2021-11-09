import React from 'react'
import cssCustomProperties from 'sanity:css-custom-properties'
import {ThemePropertyGroup} from './propertyGroup'
import metadata from './metadata'
import {getData} from './helpers'

import styles from './tool.css'

function CSSVariablesTool() {
  const data = React.useMemo(() => getData(metadata, cssCustomProperties), [
    metadata,
    cssCustomProperties,
  ])

  return (
    <div className={styles.root}>
      <h1>CSS variables</h1>

      {data.unused.length > 0 && (
        <details style={{background: '#cc9', color: '#990'}}>
          <summary>{data.unused.length} unused properties</summary>
          <pre>{data.unused.join('\n')}</pre>
        </details>
      )}

      {data.unknown.length > 0 && (
        <details style={{color: '#f00'}}>
          <summary>Unknown</summary>
          <pre>{data.unknown.join('\n')}</pre>
        </details>
      )}

      <div>
        {data.groups.map((group) => (
          <ThemePropertyGroup group={group} key={group.name} />
        ))}
      </div>
    </div>
  )
}

export default {
  title: 'CSS variables',
  name: 'css-variables',
  component: CSSVariablesTool,
}
