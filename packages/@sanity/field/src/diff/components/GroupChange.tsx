import * as React from 'react'
import classNames from 'classnames'
import {useDocumentOperation} from '@sanity/react-hooks'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {isPTSchemaType} from '../../types/portableText/diff'
import {GroupChangeNode, OperationsAPI} from '../../types'
import {useHover} from '../../utils/useHover'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'

import styles from './GroupChange.css'

export function GroupChange({change: group}: {change: GroupChangeNode}): React.ReactElement {
  const {titlePath, changes} = group
  const {
    documentId,
    schemaType,
    FieldWrapper = React.Fragment,
    rootDiff,
    isComparingCurrent
  } = React.useContext(DocumentChangeContext)

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

      <FieldWrapper path={group.path}>
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
      </FieldWrapper>
    </div>
  )
}
