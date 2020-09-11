import {useDocumentOperation} from '@sanity/react-hooks'
import * as React from 'react'
import {useHover} from '../../utils/useHover'
import {GroupChangeNode, OperationsAPI} from '../../types'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'
import {undoChange} from './undoChange'
import styles from './GroupChange.css'

export function GroupChange({change: group}: {change: GroupChangeNode}): React.ReactElement {
  const {titlePath, changes} = group
  const {documentId, schemaType} = React.useContext(DocumentChangeContext)
  const [hoverRef, isHoveringRevert] = useHover<HTMLDivElement>()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI

  const handleRevertChanges = React.useCallback(() => undoChange(group, docOperations), [
    documentId,
    group
  ])

  return (
    <div className={styles.groupChange}>
      <div className={styles.changeHeader}>
        <ChangeBreadcrumb titlePath={titlePath} />
      </div>

      <div className={isHoveringRevert ? styles.changeListOutlined : styles.changeList}>
        {changes.map(change => (
          <ChangeResolver key={change.key} change={change} />
        ))}

        <div ref={hoverRef} className={styles.revertChangesButtonContainer}>
          <RevertChangesButton onClick={handleRevertChanges} />
        </div>
      </div>
    </div>
  )
}
