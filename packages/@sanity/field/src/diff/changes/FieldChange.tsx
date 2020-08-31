import {useDocumentOperation} from '@sanity/react-hooks'
import React, {useCallback, useContext} from 'react'
import {ChangeHeader} from './ChangeHeader'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'
import {undoChange} from './undoChange'
import {FieldChangeNode, OperationsAPI} from '../types'

import styles from './FieldChange.css'

const FallbackDiff = () => <div>Missing diff</div>

export function FieldChange({change}: {change: FieldChangeNode}) {
  const DiffComponent = change.diffComponent || FallbackDiff
  const {documentId, schemaType} = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI

  const handleRevertChanges = useCallback(
    () => undoChange(change.diff, change.path, docOperations),
    [documentId, change.key, change.diff]
  )

  return (
    <div>
      <ChangeHeader titlePath={change.titlePath} />

      <div className={styles.diffComponent}>
        <DiffErrorBoundary>
          <DiffComponent diff={change.diff} schemaType={change.schemaType} />
        </DiffErrorBoundary>
      </div>

      <div>
        <RevertChangesButton onClick={handleRevertChanges} />
      </div>
    </div>
  )
}
