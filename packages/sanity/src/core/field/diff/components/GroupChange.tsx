import {Box, Stack} from '@sanity/ui'
import {Fragment, type HTMLAttributes, useCallback, useContext, useMemo, useState} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {useDocumentOperation} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPairPermissions} from '../../../store'
import {pathsAreEqual} from '../../paths'
import {type GroupChangeNode} from '../../types'
import {isPTSchemaType} from '../../types/portableText/diff'
import {useHover} from '../../utils/useHover'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {useDocumentChange} from '../hooks'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {ChangeListWrapper, GroupChangeContainer} from './GroupChange.styled'
import {RevertChangesButton} from './RevertChangesButton'
import {RevertChangesConfirmDialog} from './RevertChangesConfirmDialog'

/** @internal */
export function GroupChange(
  props: {
    change: GroupChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & HTMLAttributes<HTMLDivElement>,
): React.JSX.Element | null {
  const {change: group, readOnly, hidden, ...restProps} = props
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = useContext(DiffContext)
  const {
    documentId,
    schemaType,
    FieldWrapper = Fragment,
    rootDiff,
    isComparingCurrent,
  } = useDocumentChange()
  const {t} = useTranslation()

  const isPortableText = changes.every(
    (change) => isFieldChange(change) && isPTSchemaType(change.schemaType),
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [revertButtonRef, isRevertButtonHovered] = useHover<HTMLButtonElement>()

  const {selectedReleaseId} = usePerspective()
  const docOperations = useDocumentOperation(documentId, schemaType.name, selectedReleaseId)
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const handleRevertChanges = useCallback(() => {
    undoChange(group, rootDiff, docOperations)
    setConfirmRevertOpen(false)
  }, [group, rootDiff, docOperations])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const content = useMemo(
    () =>
      hidden ? null : (
        <>
          <Stack
            gap={1}
            as={GroupChangeContainer}
            data-ui="group-change-content"
            data-revert-group-hover={isRevertButtonHovered ? '' : undefined}
            data-portable-text={isPortableText ? '' : undefined}
          >
            <Stack as={ChangeListWrapper} gap={5} data-ui="group-change-list">
              {changes.map((change) => (
                <ChangeResolver
                  key={change.key}
                  change={change}
                  readOnly={readOnly}
                  hidden={hidden}
                  // If the path of the nested change is more than two levels deep, we want to add a wrapper
                  // with the parent path, for the change indicator to be shown.
                  addParentWrapper={change.path.length - group.path.length > 1}
                />
              ))}
            </Stack>
            {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
              <Box>
                <RevertChangesButton
                  changeCount={changes.length}
                  onClick={handleRevertChangesConfirm}
                  ref={revertButtonRef}
                  selected={confirmRevertOpen}
                  disabled={readOnly}
                  data-testid={`group-change-revert-button-${group.fieldsetName}`}
                />
              </Box>
            )}
          </Stack>

          <RevertChangesConfirmDialog
            open={confirmRevertOpen}
            onConfirm={handleRevertChanges}
            onCancel={closeRevertChangesConfirmDialog}
            changeCount={changes.length}
            referenceElement={revertButtonRef.current}
          />
        </>
      ),
    [
      changes,
      confirmRevertOpen,
      group.fieldsetName,
      group.path.length,
      handleRevertChangesConfirm,
      hidden,
      isComparingCurrent,
      isPermissionsLoading,
      isPortableText,
      isRevertButtonHovered,
      permissions?.granted,
      readOnly,
      revertButtonRef,
      handleRevertChanges,
      closeRevertChangesConfirmDialog,
    ],
  )

  const isPortableTextGroupArray =
    group.schemaType?.jsonType === 'array' &&
    group.schemaType.of.some((ofType) => ofType.name === 'block')

  return hidden ? null : (
    <Stack gap={1} {...restProps}>
      <ChangeBreadcrumb titlePath={titlePath} />
      {isNestedInDiff || isPortableTextGroupArray ? (
        content
      ) : (
        <FieldWrapper hasRevertHover={isRevertButtonHovered} path={groupPath}>
          {content}
        </FieldWrapper>
      )}
    </Stack>
  )
}
