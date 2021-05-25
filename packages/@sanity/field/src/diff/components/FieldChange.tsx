import {DialogAction} from '@sanity/base/__legacy/@sanity/components'
import {LegacyLayerProvider} from '@sanity/base/components'
import {useDocumentOperation} from '@sanity/react-hooks'
import classNames from 'classnames'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import React, {useCallback, useContext, useState} from 'react'
import {unstable_useCheckDocumentPermission as useCheckDocumentPermission} from '@sanity/base/hooks'
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
    FieldWrapper = React.Fragment,
  } = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = React.useState(false)
  const [revertHovered, setRevertHovered] = useState(false)
  const [revertButtonElement, setRevertButtonElement] = useState<HTMLDivElement | null>(null)

  const updatePermission = useCheckDocumentPermission(documentId, schemaType.name, 'update')

  const handleRevertChanges = useCallback(() => {
    undoChange(change, rootDiff, docOperations)
  }, [change, rootDiff, docOperations])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = React.useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const handleConfirmDialogAction = useCallback((action: DialogAction) => {
    if (action.action) action.action()
  }, [])

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
      <FieldWrapper path={change.path} hasHover={revertHovered}>
        <DiffInspectWrapper change={change} className={styles.change}>
          {change.error ? (
            <ValueError error={change.error} />
          ) : (
            <DiffErrorBoundary>
              <DiffContext.Provider value={{path: change.path}}>
                <DiffComponent diff={change.diff} schemaType={change.schemaType as any} />
              </DiffContext.Provider>
            </DiffErrorBoundary>
          )}
          {isComparingCurrent && updatePermission.granted && (
            <div className={styles.revertChangesButtonContainer}>
              <RevertChangesButton
                onClick={handleRevertChangesConfirm}
                onMouseEnter={handleRevertButtonMouseEnter}
                onMouseLeave={handleRevertButtonMouseLeave}
                ref={setRevertButtonElement}
                selected={confirmRevertOpen}
              />
            </div>
          )}
        </DiffInspectWrapper>
      </FieldWrapper>

      {confirmRevertOpen && (
        <LegacyLayerProvider zOffset="paneFooter">
          <PopoverDialog
            actions={[
              {
                color: 'danger',
                action: handleRevertChanges,
                title: 'Revert change',
              },
              {
                kind: 'simple',
                action: closeRevertChangesConfirmDialog,
                title: 'Cancel',
              },
            ]}
            onAction={handleConfirmDialogAction}
            onClickOutside={closeRevertChangesConfirmDialog}
            portal
            referenceElement={revertButtonElement}
            size="small"
          >
            Are you sure you want to revert the changes?
          </PopoverDialog>
        </LegacyLayerProvider>
      )}
    </div>
  )
}
