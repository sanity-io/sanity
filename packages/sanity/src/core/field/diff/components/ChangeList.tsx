import {type SanityDocument} from '@sanity/client'
import {RevertIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Card, Stack} from '@sanity/ui'
import {startTransition, useCallback, useContext, useMemo, useState} from 'react'
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
  const [buttonElement, _setButtonElement] = useState<HTMLButtonElement | null>(null)
  const setButtonElement = (element: HTMLButtonElement | null) => {
    /**
     * The startTransition wrapper here is to avoid an issue when on React 18 where this error can happen:
     * \>Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
     * This doesn't happen on React 19 due to automatic batching of all state updates, the startTransition wrapper here gives a type of batching for 18 users in a way that still works with 19.
     */
    startTransition(() => _setButtonElement(element))
  }
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
      <Stack space={5}>
        <Stack as={ChangeListWrapper} space={5}>
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
              ref={setButtonElement}
            />
          </Stack>
        )}
      </Stack>

      <RevertChangesConfirmDialog
        open={confirmRevertAllOpen}
        onConfirm={revertAllChanges}
        onCancel={closeRevertAllChangesConfirmDialog}
        changeCount={changes.length}
        referenceElement={buttonElement}
      />
    </Card>
  )
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
