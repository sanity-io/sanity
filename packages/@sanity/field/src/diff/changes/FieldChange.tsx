import React, {useCallback, useContext} from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {FieldChangeNode, OperationsAPI} from '../../types'
import {DiffContext} from '../context/DiffContext'
import {FallbackDiff} from '../fallback/FallbackDiff'
import {ValueError} from './ValueError'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'
import {undoChange} from './undoChange'

import styles from './FieldChange.css'
import {DiffInspectWrapper} from './DiffInspectWrapper'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'

export function FieldChange({change}: {change: FieldChangeNode}): React.ReactElement {
  const DiffComponent = change.diffComponent || FallbackDiff
  const {documentId, schemaType, rootDiff, isComparingCurrent} = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI

  const handleRevertChanges = useCallback(() => undoChange(change, rootDiff, docOperations), [
    change,
    rootDiff,
    docOperations
  ])

  const rootClass = change.error ? styles.error : styles.root
  return (
    <div className={rootClass}>
      {change.showHeader && <ChangeBreadcrumb titlePath={change.titlePath} />}

      <DiffInspectWrapper change={change}>
        <div className={styles.change}>
          {change.error ? (
            <ValueError error={change.error} />
          ) : (
            <DiffErrorBoundary>
              <DiffContext.Provider value={{path: change.path}}>
                <DiffComponent diff={change.diff} schemaType={change.schemaType} />
              </DiffContext.Provider>
            </DiffErrorBoundary>
          )}

          {isComparingCurrent && (
            <div className={styles.revertChangesButtonContainer}>
              <RevertChangesButton onClick={handleRevertChanges} />
            </div>
          )}
        </div>
      </DiffInspectWrapper>
    </div>
  )
}
