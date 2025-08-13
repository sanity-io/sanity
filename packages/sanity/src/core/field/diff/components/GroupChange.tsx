import {Box, Flex, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {
  Fragment,
  type HTMLAttributes,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {Button} from '../../../../ui-components/button/Button'
import {Popover} from '../../../../ui-components/popover/Popover'
import {useDocumentOperation} from '../../../hooks/useDocumentOperation'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useDocumentPairPermissions} from '../../../store/_legacy/grants/documentPairPermissions'
import {pathsAreEqual} from '../../paths/helpers'
import {type FieldOperationsAPI, type GroupChangeNode} from '../../types'
import {isPTSchemaType} from '../../types/portableText/diff/helpers'
import {useHover} from '../../utils/useHover'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {useDocumentChange} from '../hooks/useDocumentChange'
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

  const docOperations = useDocumentOperation(documentId, schemaType.name) as FieldOperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)

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

  useClickOutsideEvent(
    () => setConfirmRevertOpen(false),
    () => [popoverRef.current],
  )

  const content = useMemo(
    () =>
      hidden ? null : (
        <Stack
          space={1}
          as={GroupChangeContainer}
          data-ui="group-change-content"
          data-revert-group-hover={isRevertButtonHovered ? '' : undefined}
          data-portable-text={isPortableText ? '' : undefined}
        >
          <Stack as={ChangeListWrapper} space={5} data-ui="group-change-list">
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
              ref={popoverRef}
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
      group.path.length,
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

  const isPortableTextGroupArray =
    group.schemaType?.jsonType === 'array' &&
    group.schemaType.of.some((ofType) => ofType.name === 'block')

  return hidden ? null : (
    <Stack space={1} {...restProps}>
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
