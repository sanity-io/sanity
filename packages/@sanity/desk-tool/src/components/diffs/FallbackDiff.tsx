import * as React from 'react'
import {Diff} from '@sanity/diff'
import {Annotation} from '../../panes/documentPane/history/types'
import {DiffComponent} from './types'

export const FallbackDiff: DiffComponent<Diff<Annotation>> = ({diff}) => {
  return (
    <div>
      Missing diff component
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
