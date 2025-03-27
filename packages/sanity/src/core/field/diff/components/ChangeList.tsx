import {type SanityDocument} from '@sanity/client'
import {RevertIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Card, Stack} from '@sanity/ui'
import {useCallback, useContext, useMemo, useRef, useState} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {Button} from '../../../../ui-components'
import {useDocumentOperation} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPairPermissions} from '../../../store'
import {unstable_useConditionalProperty as useConditionalProperty} from '../../conditional-property'
import {type ChangeNode, type ObjectDiff} from '../../types'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {useDocumentChange} from '../hooks/useDocumentChange'
import {ChangeListWrapper} from './ChangeList.styled'
import {ChangeResolver} from './ChangeResolver'
import {NoChanges} from './NoChanges'
import {RevertChangesConfirmDialog} from './RevertChangesConfirmDialog'

/** @internal */
export interface ChangeListProps {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

/** @internal */
export function ChangeList({diff, fields, schemaType}: ChangeListProps): React.JSX.Element | null {
  const {documentId, isComparingCurrent, value} = useDocumentChange()
  const {selectedReleaseId} = usePerspective()
  const docOperations = useDocumentOperation(documentId, schemaType.name, selectedReleaseId)
  const {path} = useContext(DiffContext)
  const isRoot = path.length === 0
  const [confirmRevertAllOpen, setConfirmRevertAllOpen] = useState(false)
  const [confirmRevertAllHover, setConfirmRevertAllHover] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
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

  if (changes.length === 0) {
    return isRoot ? <NoChanges /> : null
  }

  const showFooter = isRoot && changes.length > 1

  return (
    <Card>
      <Stack gap={5}>
        <Stack as={ChangeListWrapper} gap={5}>
          {changes.map((change) => (
            <div key={change.key}>
              <ChangeResolver
                key={change.key}
                change={change}
                data-revert-all-changes-hover={confirmRevertAllHover ? '' : undefined}
                readOnly={isReadOnly || change?.readOnly}
                hidden={change?.hidden}
                // If the path of the nested change is more than two levels deep, we want to add a wrapper
                // with the parent path, for the change indicator to be shown.
                addParentWrapper={change.path.length > 1}
              />
            </div>
          ))}
        </Stack>

        {showFooter && isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
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
              ref={buttonRef}
            />
          </Stack>
        )}
      </Stack>

      <RevertChangesConfirmDialog
        open={confirmRevertAllOpen}
        onConfirm={revertAllChanges}
        onCancel={closeRevertAllChangesConfirmDialog}
        changeCount={changes.length}
        referenceElement={buttonRef.current}
      />
    </Card>
  )
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
