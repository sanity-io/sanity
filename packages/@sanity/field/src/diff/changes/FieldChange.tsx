import {useDocumentOperation} from '@sanity/react-hooks'
import React, {useCallback, useContext} from 'react'
import {FieldChangeNode, OperationsAPI, ShowDiffHeader} from '../../types'
import {DiffContext} from '../context/DiffContext'
import {FallbackDiff} from '../fallback/FallbackDiff'
import {ValueError} from './ValueError'
import {ChangeHeader} from './ChangeHeader'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'
import {undoChange} from './undoChange'

import styles from './FieldChange.css'

function hasFlag(value: ShowDiffHeader, flag: number) {
  // eslint-disable-next-line no-bitwise
  return (value & flag) === flag
}

export function FieldChange({
  change,
  isGrouped
}: {
  change: FieldChangeNode
  isGrouped?: boolean
}): React.ReactElement {
  const DiffComponent = change.diffComponent || FallbackDiff
  const {documentId, schemaType, rootDiff} = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI

  const handleRevertChanges = useCallback(() => undoChange(change, rootDiff, docOperations), [
    change,
    rootDiff,
    docOperations
  ])

  const rootClass = change.error ? styles.error : styles.root
  const showHeader =
    hasFlag(change.showHeader, ShowDiffHeader.Always) ||
    (hasFlag(change.showHeader, ShowDiffHeader.WhenMoved) && change.itemDiff?.hasMoved) ||
    (hasFlag(change.showHeader, ShowDiffHeader.WhenNotGrouped) && !isGrouped)

  return (
    <div className={rootClass}>
      {showHeader && <ChangeHeader titlePath={change.titlePath} />}

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

        <div className={styles.revertChangesButtonContainer}>
          <RevertChangesButton onClick={handleRevertChanges} />
        </div>
      </div>
    </div>
  )
}
