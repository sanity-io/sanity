import {useDocumentOperation} from '@sanity/react-hooks'
import classNames from 'classnames'
import React, {useCallback, useContext, useState} from 'react'
import {undoChange} from '../changes/undoChange'
import {DiffContext} from '../contexts/DiffContext'
import {FieldChangeNode, OperationsAPI} from '../../types'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DiffInspectWrapper} from './DiffInspectWrapper'
import {DocumentChangeContext} from './DocumentChangeContext'
import {FallbackDiff} from './FallbackDiff'
import {RevertChangesButton} from './RevertChangesButton'
import {ValueError} from './ValueError'

import styles from './FieldChange.css'

export function FieldChange({change}: {change: FieldChangeNode}) {
  const DiffComponent = change.diffComponent || FallbackDiff
  const {
    documentId,
    schemaType,
    rootDiff,
    isComparingCurrent,
    FieldWrapper = React.Fragment
  } = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const [revertHovered, setRevertHovered] = useState(false)

  const handleRevertChanges = useCallback(() => undoChange(change, rootDiff, docOperations), [
    change,
    rootDiff,
    docOperations
  ])

  const rootClass = classNames(
    change.error ? styles.error : styles.root,
    revertHovered && styles.revertHovered
  )

  const handleRevertButtonMouseEnter = useCallback(() => {
    setRevertHovered(true)
  }, [])

  const handleRevertButtonMouseLeave = useCallback(() => {
    setRevertHovered(false)
  }, [])

  return (
    <div className={rootClass}>
      {change.showHeader && (
        <div className={styles.header}>
          <ChangeBreadcrumb change={change} titlePath={change.titlePath} />
        </div>
      )}
      <FieldWrapper path={change.path}>
        <DiffInspectWrapper change={change} className={styles.change}>
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
              <RevertChangesButton
                onClick={handleRevertChanges}
                onMouseEnter={handleRevertButtonMouseEnter}
                onMouseLeave={handleRevertButtonMouseLeave}
              />
            </div>
          )}
        </DiffInspectWrapper>
      </FieldWrapper>
    </div>
  )
}
