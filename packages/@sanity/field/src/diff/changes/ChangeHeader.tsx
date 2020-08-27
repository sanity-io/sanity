import React, {useCallback, useContext} from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {ChangeTitlePath, FieldChangeNode, OperationsAPI} from '../types'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {DocumentChangeContext} from './DocumentChangeContext'
import {undoChange} from './undoChange'
import styles from './ChangeHeader.css'

export function ChangeHeader({
  change,
  titlePath
}: {
  change: FieldChangeNode
  titlePath: ChangeTitlePath
}) {
  const {documentId, schemaType} = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const handleUndoChange = useCallback(() => undoChange(change.diff, change.path, docOperations), [
    documentId,
    change.key,
    change.diff
  ])

  return (
    <div className={styles.root}>
      <ChangeBreadcrumb titlePath={titlePath} />

      <button type="button" className={styles.revertButton} onClick={handleUndoChange}>
        Revert changes
      </button>
    </div>
  )
}
