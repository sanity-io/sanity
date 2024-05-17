import {Box, Flex, Stack, Text, useClickOutside} from '@sanity/ui'
import {
  type HTMLAttributes,
  type ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {Button, Popover} from '../../../../ui-components'
import {useDocumentOperation} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {useDocumentPairPermissions} from '../../../store'
import {pathsAreEqual} from '../../paths'
import {type FieldOperationsAPI, type GroupChangeNode} from '../../types'
import {isPTSchemaType} from '../../types/portableText/diff'
import {useHover} from '../../utils/useHover'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {useDocumentChange} from '../hooks'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {ChangeListWrapper, GroupChangeContainer} from './GroupChange.styled'
import {RevertChangesButton} from './RevertChangesButton'

/** @internal */
export function GroupChange(
  props: {
    change: GroupChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & HTMLAttributes<HTMLDivElement>,
): ReactElement | null {
  const {change: group, readOnly, hidden, ...restProps} = props
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = useContext(DiffContext)
  const {documentId, schemaType, FieldWrapper, rootDiff, isComparingCurrent} = useDocumentChange()
  const {t} = useTranslation()

  const isPortableText = changes.every(
    (change) => isFieldChange(change) && isPTSchemaType(change.schemaType),
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [revertButtonRef, isRevertButtonHovered] = useHover<HTMLButtonElement>()

  const docOperations = useDocumentOperation(documentId, schemaType.name) as FieldOperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertPopoverElement, setRevertPopoverElement] = useState<HTMLDivElement | null>(null)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const handleRevertChanges = useCallback(
    () => undoChange(group, rootDiff, docOperations),
    [group, rootDiff, docOperations],
  )

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  useClickOutside(() => setConfirmRevertOpen(false), [revertPopoverElement])

  const content = useMemo(
    () =>
      hidden ? null : (
        <Stack
          space={1}
          as={GroupChangeContainer}
          data-revert-group-hover={isRevertButtonHovered ? '' : undefined}
          data-portable-text={isPortableText ? '' : undefined}
        >
          <Stack as={ChangeListWrapper} space={5}>
            {changes.map((change) => (
              <ChangeResolver
                key={change.key}
                change={change}
                readOnly={readOnly}
                hidden={hidden}
              />
            ))}
          </Stack>
          {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
            <Popover
              content={
                <Stack space={3}>
                  <Box paddingY={3}>
                    <Text size={1}>
                      {t('changes.action.revert-changes-description', {count: changes.length})}
                    </Text>
                  </Box>
                  <Flex gap={3} justify="flex-end">
                    <Button
                      mode="ghost"
                      onClick={closeRevertChangesConfirmDialog}
                      text={t('changes.action.revert-all-cancel')}
                    />
                    <Button
                      tone="critical"
                      onClick={handleRevertChanges}
                      text={t('changes.action.revert-changes-confirm-change', {count: 1})}
                    />
                  </Flex>
                </Stack>
              }
              padding={3}
              portal
              placement="left"
              open={confirmRevertOpen}
              ref={setRevertPopoverElement}
            >
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
            </Popover>
          )}
        </Stack>
      ),
    [
      changes,
      closeRevertChangesConfirmDialog,
      confirmRevertOpen,
      group.fieldsetName,
      handleRevertChanges,
      handleRevertChangesConfirm,
      hidden,
      isComparingCurrent,
      isPermissionsLoading,
      isPortableText,
      isRevertButtonHovered,
      permissions?.granted,
      readOnly,
      revertButtonRef,
      t,
    ],
  )

  return hidden ? null : (
    <Stack space={1} {...restProps}>
      <ChangeBreadcrumb titlePath={titlePath} />
      {isNestedInDiff || !FieldWrapper ? (
        content
      ) : (
        <FieldWrapper hasHover={isRevertButtonHovered} path={group.path}>
          {content}
        </FieldWrapper>
      )}
    </Stack>
  )
}
