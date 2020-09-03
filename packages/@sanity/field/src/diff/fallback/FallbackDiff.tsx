import * as React from 'react'
import {DiffComponent} from '../types'

import styles from './FallbackDiff.css'

export const FallbackDiff: DiffComponent = ({diff}) => {
  return (
    <div className={styles.root}>
      <div>
        <strong>
          Missing diff component (<code>{diff.type}</code>)
        </strong>
      </div>

      <details>
        <summary>JSON</summary>

        <h2>From</h2>
        <pre>
          <code>{JSON.stringify(diff.fromValue, null, 2)}</code>
        </pre>

        <h2>To</h2>
        <pre>
          <code>{JSON.stringify(diff.toValue, null, 2)}</code>
        </pre>
      </details>
    </div>
  )
}
