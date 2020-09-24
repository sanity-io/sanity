import * as React from 'react'
import classNames from 'classnames'
import {useDocumentOperation} from '@sanity/react-hooks'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {isPTSchemaType} from '../../types/portableText/diff'
import {GroupChangeNode, OperationsAPI} from '../../types'
import {useHover} from '../../utils/useHover'
import {pathsAreEqual} from '../../paths'
import {DiffContext} from '../contexts/DiffContext'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'

import styles from './GroupChange.css'

export function GroupChange({change: group}: {change: GroupChangeNode}): React.ReactElement {
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = React.useContext(DiffContext)
  const {documentId, schemaType, FieldWrapper, rootDiff, isComparingCurrent} = React.useContext(
    DocumentChangeContext
  )

  const isPortableText = changes.every(
    change => isFieldChange(change) && isPTSchemaType(change.schemaType)
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [hoverRef, isHoveringRevert] = useHover<HTMLDivElement>()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI

  const handleRevertChanges = React.useCallback(() => undoChange(group, rootDiff, docOperations), [
    group,
    rootDiff,
    docOperations
  ])

  const content = (
    <div className={isHoveringRevert ? styles.contentOutlined : styles.content}>
      <div className={styles.changeList}>
        {changes.map(change => (
          <ChangeResolver key={change.key} change={change} />
        ))}
      </div>

      {isComparingCurrent && (
        <div ref={hoverRef} className={styles.revertChangesButtonContainer}>
          <RevertChangesButton onClick={handleRevertChanges} />
        </div>
      )}
    </div>
  )

  return (
    <div className={classNames(styles.groupChange, isPortableText && styles.portableText)}>
      <div className={styles.changeHeader}>
        <ChangeBreadcrumb titlePath={titlePath} />
      </div>
      {isNestedInDiff || !FieldWrapper ? (
        content
      ) : (
        <FieldWrapper path={group.path} hasHover={isHoveringRevert}>
          {content}
        </FieldWrapper>
      )}
    </div>
  )
}
