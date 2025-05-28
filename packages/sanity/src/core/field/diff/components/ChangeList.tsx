import {type SanityDocument} from '@sanity/client'
import {RevertIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Box, Card, Flex, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useContext, useMemo, useRef, useState} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {Button, Popover} from '../../../../ui-components'
import {useDocumentOperation} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {useDocumentPairPermissions} from '../../../store'
import {unstable_useConditionalProperty as useConditionalProperty} from '../../conditional-property'
import {type ChangeNode, type FieldOperationsAPI, type ObjectDiff} from '../../types'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {useDocumentChange} from '../hooks/useDocumentChange'
import {ChangeListWrapper} from './ChangeList.styled'
import {ChangeResolver} from './ChangeResolver'
import {NoChanges} from './NoChanges'

/** @internal */
export interface ChangeListProps {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

/** @internal */
export function ChangeList({diff, fields, schemaType}: ChangeListProps): React.JSX.Element | null {
  const {documentId, isComparingCurrent, value} = useDocumentChange()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as FieldOperationsAPI
  const {path} = useContext(DiffContext)
  const isRoot = path.length === 0
  const [confirmRevertAllOpen, setConfirmRevertAllOpen] = useState(false)
  const [confirmRevertAllHover, setConfirmRevertAllHover] = useState(false)
  const {t} = useTranslation()

  const isReadOnly = useConditionalProperty({
    document: value as SanityDocument,
    value: undefined,
    checkProperty: schemaType.readOnly,
    checkPropertyKey: 'readOnly',
  })

  if (schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ChangeList`)
  }

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const allChanges = useMemo(
    () => buildObjectChangeList(schemaType, diff, path, [], {fieldFilter: fields}),
    [schemaType, fields, path, diff],
  )

  const changes = useMemo(
    () => (fields && fields.length === 0 ? [] : maybeFlatten(allChanges)),
    [allChanges, fields],
  )

  const rootChange = allChanges[0]

  const revertAllChanges = useCallback(() => {
    undoChange(rootChange, diff, docOperations)
    setConfirmRevertAllOpen(false)
  }, [rootChange, diff, docOperations])

  const handleRevertAllChangesClick = useCallback(() => {
    setConfirmRevertAllOpen(true)
  }, [])

  const handleRevertAllChangesMouseEnter = useCallback(() => {
    setConfirmRevertAllHover(true)
  }, [])

  const handleRevertAllChangesMouseLeave = useCallback(() => {
    setConfirmRevertAllHover(false)
  }, [])

  const closeRevertAllChangesConfirmDialog = useCallback(() => {
    setConfirmRevertAllOpen(false)
  }, [])

  const revertAllContainerElementRef = useRef<HTMLDivElement | null>(null)

  useClickOutsideEvent(
    () => setConfirmRevertAllOpen(false),
    () => [revertAllContainerElementRef.current],
  )

  if (changes.length === 0) {
    return isRoot ? <NoChanges /> : null
  }

  const showFooter = isRoot && changes.length > 1

  return (
    <Card>
      <Stack space={5}>
        <Stack as={ChangeListWrapper} space={5}>
          {changes.map((change) => (
            <div key={change.key}>
              <ChangeResolver
                change={change}
                key={change.key}
                data-revert-all-changes-hover={confirmRevertAllHover ? '' : undefined}
                readOnly={isReadOnly || change?.readOnly}
                hidden={change?.hidden}
              />
            </div>
          ))}
        </Stack>

        {showFooter && isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
          <Popover
            content={
              <Stack space={3}>
                <Box paddingY={3}>
                  <Text size={1}>
                    {t('changes.action.revert-all-description', {
                      count: changes.length,
                    })}
                  </Text>
                </Box>
                <Flex gap={3} justify="flex-end">
                  <Button
                    mode="ghost"
                    text={t('changes.action.revert-all-cancel')}
                    onClick={closeRevertAllChangesConfirmDialog}
                  />
                  <Button
                    tone="critical"
                    text={t('changes.action.revert-all-confirm')}
                    onClick={revertAllChanges}
                  />
                </Flex>
              </Stack>
            }
            open={confirmRevertAllOpen}
            padding={3}
            placement={'left'}
            portal
            ref={revertAllContainerElementRef}
          >
            <Stack>
              <Button
                tone="critical"
                mode="ghost"
                text={t('changes.action.revert-all-confirm')}
                icon={RevertIcon}
                onClick={handleRevertAllChangesClick}
                onMouseEnter={handleRevertAllChangesMouseEnter}
                onMouseLeave={handleRevertAllChangesMouseLeave}
                disabled={isReadOnly}
                size="large"
              />
            </Stack>
          </Popover>
        )}
      </Stack>
    </Card>
  )
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
