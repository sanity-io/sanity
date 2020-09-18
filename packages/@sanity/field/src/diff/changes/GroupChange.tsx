import * as React from 'react'
import classNames from 'classnames'
import {useDocumentOperation} from '@sanity/react-hooks'
import {isPTSchemaType} from '../../types/portableText/diff'
import {useHover} from '../../utils/useHover'
import {GroupChangeNode, OperationsAPI} from '../../types'
import {isFieldChange} from '../helpers'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'
import {undoChange} from './undoChange'
import styles from './GroupChange.css'

export function GroupChange({change: group}: {change: GroupChangeNode}): React.ReactElement {
  const {titlePath, changes} = group
  const {documentId, schemaType, rootDiff, isComparingCurrent} = React.useContext(
    DocumentChangeContext
  )

  const isPortableText = changes.every(
    change => isFieldChange(change) && isPTSchemaType(change.schemaType)
  )

  const [hoverRef, isHoveringRevert] = useHover<HTMLDivElement>()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI

  const handleRevertChanges = React.useCallback(() => undoChange(group, rootDiff, docOperations), [
    group,
    rootDiff,
    docOperations
  ])

  return (
    <div className={classNames(styles.groupChange, isPortableText && styles.portableText)}>
      <div className={styles.changeHeader}>
        <ChangeBreadcrumb titlePath={titlePath} />
      </div>

      <div className={isHoveringRevert ? styles.changeListOutlined : styles.changeList}>
        {changes.map(change => (
          <ChangeResolver key={change.key} change={change} />
        ))}

        {isComparingCurrent && (
          <div ref={hoverRef} className={styles.revertChangesButtonContainer}>
            <RevertChangesButton onClick={handleRevertChanges} />
          </div>
        )}
      </div>
    </div>
  )
}
