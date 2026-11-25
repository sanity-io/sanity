import {type ReactNode} from 'react'
import {useDataset} from 'sanity'
import {CommandList} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'
import {Box, Flex, Text} from 'ui5'

import {visionLocaleNamespace} from '../../../../i18n'
import {
  DOCUMENT_LIST_SHAPE,
  type DocumentListDocument,
  type DocumentListProblem,
  type ParsedDocumentList,
} from '../../../util/documentListResult'
import * as styles from './DocumentList.module.css'
import {DocumentListRow} from './DocumentListRow'

/** Close to the default preview row, and the list measures the real height */
const ROW_HEIGHT = 51

export interface DocumentListViewProps {
  className?: string
  /** The dataset the result came from; rows link only when it is the workspace's dataset */
  datasetName: string
  id: string
  parsed: ParsedDocumentList
  /** Rows show the live preview from their schema type's preview config, for rows without their own */
  resolvePreviews?: boolean
  /**
   * Offered over the rows, or under the expected shape when the result is not a document list:
   * the AI action that changes the query for the list to show it
   */
  action?: ReactNode
}

/**
 * Lists the documents already in the result. There is no second query: the rows are the objects
 * the result returned.
 */
export function DocumentListView({
  className,
  datasetName,
  id,
  parsed,
  resolvePreviews = false,
  action,
}: DocumentListViewProps) {
  const linkDocuments = useDataset() === datasetName
  return (
    <Flex
      className={className ? `${styles.root} ${className}` : styles.root}
      flexDirection="column"
      id={id}
    >
      {action && parsed.ok && parsed.documents.length > 0 && (
        <Box className={styles.action}>{action}</Box>
      )}
      <Box className={styles.body}>
        {parsed.ok ? (
          parsed.documents.length === 0 ? (
            <Empty />
          ) : (
            <DocumentList
              documents={parsed.documents}
              id={id}
              linkDocuments={linkDocuments}
              resolvePreviews={resolvePreviews}
            />
          )
        ) : (
          <Guidance action={action} problem={parsed.problem} />
        )}
      </Box>
    </Flex>
  )
}

function Empty() {
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Notice>
      <Text muted size={1}>
        {t('vision.result.documents.empty')}
      </Text>
    </Notice>
  )
}

function DocumentList({
  documents,
  id,
  linkDocuments,
  resolvePreviews,
}: {
  documents: DocumentListDocument[]
  id: string
  linkDocuments: boolean
  resolvePreviews: boolean
}) {
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      ariaLabel={t('vision.result.view.documents')}
      canReceiveFocus
      className={styles.commandList}
      fixedHeight={false}
      getItemDisabled={() => false}
      getItemKey={(index) => `${id}:${documents[index]?._id ?? index}:${index}`}
      itemHeight={ROW_HEIGHT}
      items={documents}
      onlyShowSelectionWhenActive
      overscan={8}
      paddingBottom={1}
      paddingX={2}
      renderItem={(document) => (
        <DocumentListRow
          document={document}
          linkDocuments={linkDocuments}
          resolvePreview={resolvePreviews}
        />
      )}
      wrapAround={false}
    />
  )
}

function Notice({children}: {children: ReactNode}) {
  return <Box padding={3}>{children}</Box>
}

function Guidance({action, problem}: {action: ReactNode; problem: DocumentListProblem}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const reason =
    problem.kind === 'not-array'
      ? t('vision.result.documents.invalid.not-array')
      : problem.kind === 'missing-id'
        ? t('vision.result.documents.invalid.missing-id', {
            count: problem.count,
            total: problem.total,
          })
        : unreachable(problem)

  return (
    <Notice>
      <Flex flexDirection="column" gap={3}>
        <Text size={1}>{reason}</Text>
        <Text size={1}>
          <code className={styles.shape}>{DOCUMENT_LIST_SHAPE}</code>
        </Text>
        {action}
      </Flex>
    </Notice>
  )
}

function unreachable(value: never): never {
  throw new Error(`Unhandled document list problem: ${JSON.stringify(value)}`)
}
