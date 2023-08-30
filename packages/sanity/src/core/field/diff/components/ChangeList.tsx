import {Button, Box, Card, Grid, Stack, useClickOutside} from '@sanity/ui'
import {RevertIcon} from '@sanity/icons'
import React, {useCallback, useContext, useMemo, useState} from 'react'
import {SanityDocument} from '@sanity/client'
import {ObjectSchemaType} from '@sanity/types'
import {unstable_useConditionalProperty as useConditionalProperty} from '../../conditional-property'
import {ObjectDiff, ChangeNode, FieldOperationsAPI} from '../../types'
import {DiffContext} from '../contexts/DiffContext'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {useDocumentChange} from '../hooks/useDocumentChange'
import {useDocumentPairPermissions} from '../../../store'
import {useDocumentOperation} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {ChangeResolver} from './ChangeResolver'
import {NoChanges} from './NoChanges'
import {ChangeListWrapper, PopoverWrapper} from './ChangeList.styled'

/** @internal */
export interface ChangeListProps {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

/** @internal */
export function ChangeList({diff, fields, schemaType}: ChangeListProps): React.ReactElement | null {
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
    [schemaType, fields, path, diff]
  )

  const changes = useMemo(
    () => (fields && fields.length === 0 ? [] : maybeFlatten(allChanges)),
    [allChanges, fields]
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

  const [revertAllContainerElement, setRevertAllContainerElement] = useState<HTMLDivElement | null>(
    null
  )

  const handleClickOutside = useCallback(() => setConfirmRevertAllOpen(false), [])

  useClickOutside(handleClickOutside, [revertAllContainerElement])

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
          <PopoverWrapper
            content={
              <Box>
                {t('changes.action.revert-all-description', {
                  count: changes.length,
                })}
                <Grid columns={2} gap={2} marginTop={2}>
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
                </Grid>
              </Box>
            }
            open={confirmRevertAllOpen}
            padding={4}
            placement={'left'}
            portal
            ref={setRevertAllContainerElement}
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
              />
            </Stack>
          </PopoverWrapper>
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
