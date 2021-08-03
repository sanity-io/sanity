// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {DialogAction} from '@sanity/base/__legacy/@sanity/components'
import {LegacyLayerProvider} from '@sanity/base/components'
import {useDocumentOperation} from '@sanity/react-hooks'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import React, {useCallback, useContext, useState} from 'react'
import {unstable_useCheckDocumentPermission as useCheckDocumentPermission} from '@sanity/base/hooks'
import {Box, rem, Stack} from '@sanity/ui'
import styled from 'styled-components'
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

const ChangeListWrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`

const GroupChangeContainer = styled.div`
  --field-change-error: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg};
  --diff-inspect-padding-xsmall: ${({theme}) => rem(theme.sanity.space[1])};
  --diff-inspect-padding-small: ${({theme}) => rem(theme.sanity.space[2])};

  position: relative;
  padding: var(--diff-inspect-padding-xsmall) var(--diff-inspect-padding-small);

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-left: 1px solid var(--card-border-color);
  }

  &[data-error]:hover::before,
  &[data-revert-group-hover]:hover::before,
  &[data-revert-all-groups-hover]::before {
    border-left: 2px solid var(--field-change-error);
  }
`

export function GroupChange({
  change: group,
  readOnly,
  ...restProps
}: {change: GroupChangeNode; readOnly?: boolean} & React.HTMLAttributes<
  HTMLDivElement
>): React.ReactElement | null {
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = useContext(DiffContext)
  const {documentId, schemaType, FieldWrapper, rootDiff, isComparingCurrent} = useContext(
    DocumentChangeContext
  )

  const isPortableText = changes.every(
    (change) => isFieldChange(change) && isPTSchemaType(change.schemaType)
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [hoverRef, isHoveringRevert] = useHover<HTMLDivElement>()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertButtonElement, setRevertButtonElement] = useState<HTMLDivElement | null>(null)

  const updatePermission = useCheckDocumentPermission(documentId, schemaType.name, 'update')

  const handleRevertChanges = useCallback(() => undoChange(group, rootDiff, docOperations), [
    group,
    rootDiff,
    docOperations,
  ])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const handleConfirmDialogAction = useCallback((action: DialogAction) => {
    if (action.action) action.action()
  }, [])

  const setRevertButtonRef = useCallback(
    (el: HTMLDivElement | null) => {
      hoverRef.current = el
      setRevertButtonElement(el)
    },
    [hoverRef]
  )
  const content = (
    <Stack
      space={1}
      as={GroupChangeContainer}
      data-revert-group-hover={isHoveringRevert ? '' : undefined}
      data-portable-text={isPortableText ? '' : undefined}
      data-revert-all-groups-hover={
        restProps['data-revert-all-changes-hover'] === '' ? '' : undefined
      }
    >
      <Stack as={ChangeListWrapper} space={5}>
        {changes.map((change) => (
          <ChangeResolver
            key={change.key}
            change={change}
            readOnly={readOnly || group?.schemaType?.readOnly}
          />
        ))}
      </Stack>
      {isComparingCurrent && updatePermission.granted && (
        <Box>
          <RevertChangesButton
            onClick={handleRevertChangesConfirm}
            ref={setRevertButtonRef}
            selected={confirmRevertOpen}
            disabled={group?.schemaType?.readOnly || readOnly}
          />
        </Box>
      )}
    </Stack>
  )

  return (group?.schemaType as any)?.hidden ? null : (
    <Stack space={1} {...restProps}>
      <ChangeBreadcrumb titlePath={titlePath} />
      {isNestedInDiff || !FieldWrapper ? (
        content
      ) : (
        <FieldWrapper path={group.path} hasHover={isHoveringRevert}>
          {content}
        </FieldWrapper>
      )}

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
            // portal
            referenceElement={revertButtonElement}
            size="small"
          >
            Are you sure you want to revert the changes?
          </PopoverDialog>
        </LegacyLayerProvider>
      )}
    </Stack>
  )
}
