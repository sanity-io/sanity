import {useDocumentOperation} from '@sanity/react-hooks'
import React, {useCallback, useContext} from 'react'
import {FieldChangeNode, OperationsAPI} from '../../types'
import {ChangeHeader} from './ChangeHeader'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'
import {undoChange} from './undoChange'

import styles from './FieldChange.css'
import {ValueError} from './ValueError'

const FallbackDiff = () => <div>Missing diff</div>

export function FieldChange({change}: {change: FieldChangeNode}): React.ReactElement {
  const DiffComponent = change.diffComponent || FallbackDiff
  const {documentId, schemaType} = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI

  const handleRevertChanges = useCallback(
    () => undoChange(change.diff, change.path, docOperations),
    [documentId, change.key, change.diff]
  )

  const rootClass = change.error ? styles.error : styles.root

  return (
    <div className={rootClass}>
      {change.renderHeader && <ChangeHeader titlePath={change.titlePath} />}

      <div className={styles.change}>
        {change.error ? (
          <ValueError error={change.error} />
        ) : (
          <DiffErrorBoundary>
            <DiffComponent diff={change.diff} schemaType={change.schemaType} />
          </DiffErrorBoundary>
        )}

        <div className={styles.revertChangesButtonContainer}>
          <RevertChangesButton onClick={handleRevertChanges} />
        </div>
      </div>
    </div>
  )
}
