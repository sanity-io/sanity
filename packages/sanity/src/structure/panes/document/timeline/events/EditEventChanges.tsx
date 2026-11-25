import {type Path} from '@sanity/types'
import {Spinner} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  ChangeList,
  type DocumentChangeContextInstance,
  type EditDocumentVersionEvent,
  useEvents,
  useTranslation,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {Box, Flex, Text} from 'ui5'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {editEventChanges} from './EditEventChanges.css'

const INITIAL_CHANGES = {loading: true, diff: null, error: null}

function PassThroughFieldWrapper(props: {
  path: Path
  children: ReactNode
  hasRevertHover: boolean
}) {
  return props.children
}

/**
 * What an edit event changed, condensed: the diff of its transactions, without who made each
 * change and without revert actions.
 */
export function EditEventChanges({event}: {event: EditDocumentVersionEvent}) {
  const {getEditChanges} = useEvents()
  const {documentId, schemaType, value} = useDocumentPane()
  const {t} = useTranslation('studio')
  const {t: tStructure} = useTranslation(structureLocaleNamespace)

  const toRevisionId = event.revisionId
  const fromRevisionId = event.transactions.at(-1)?.revisionId ?? toRevisionId
  const changes$ = useMemo(
    () => getEditChanges({fromRevisionId, toRevisionId}),
    [getEditChanges, fromRevisionId, toRevisionId],
  )
  const {loading, diff, error} = useObservable(changes$, INITIAL_CHANGES)

  const documentContext = useMemo<DocumentChangeContextInstance>(
    () => ({
      documentId,
      schemaType,
      rootDiff: diff,
      isComparingCurrent: false,
      FieldWrapper: PassThroughFieldWrapper,
      value,
      showFromValue: true,
    }),
    [diff, documentId, schemaType, value],
  )

  if (loading) {
    return (
      <Flex alignItems="center" gap={2}>
        <Spinner size={0} />
        <Text muted size={1} as="div" trim={true}>
          {t('changes.loading-changes')}
        </Text>
      </Flex>
    )
  }
  if (error) {
    return (
      <Text muted size={1} as="div" trim={true}>
        {tStructure('timeline-item.changes.error')}
      </Text>
    )
  }
  if (!diff?.isChanged) {
    return (
      <Text muted size={1} as="div" trim={true}>
        {t('changes.no-changes-title')}
      </Text>
    )
  }
  return (
    <DocumentChangeContext.Provider value={documentContext}>
      <Box className={editEventChanges} data-testid="edit-event-changes">
        <ChangeList diff={diff} schemaType={schemaType} />
      </Box>
    </DocumentChangeContext.Provider>
  )
}
