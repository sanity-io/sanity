import * as React from 'react'
import {FieldChangeNode} from '../types'
import {ChangeHeader} from './ChangeHeader'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import styles from './FieldChange.css'

const FallbackDiff = () => <div>Missing diff</div>

export function FieldChange({change}: {change: FieldChangeNode}) {
  const DiffComponent = change.diffComponent || FallbackDiff

  return (
    <div>
      <ChangeHeader change={change} titlePath={change.titlePath} />

      <div className={styles.diffComponent}>
        <DiffErrorBoundary>
          <DiffComponent diff={change.diff} schemaType={change.schemaType} />
        </DiffErrorBoundary>
      </div>
    </div>
  )
}
