import {type ReactNode} from 'react'
import {CommandList, useDataset} from 'sanity'
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
  /** Starts the list at the top, for a pane without the result's floating view controls */
  flush?: boolean
  id: string
  parsed: ParsedDocumentList
}

/**
 * Lists the documents already in the result. There is no second query: the rows are the objects
 * the result returned.
 */
export function DocumentListView({
  className,
  datasetName,
  flush,
  id,
  parsed,
}: DocumentListViewProps) {
  const linkDocuments = useDataset() === datasetName
  return (
    <Flex
      className={className ? `${styles.root} ${className}` : styles.root}
      data-flush={flush || undefined}
      flexDirection="column"
      id={id}
    >
      <Box className={styles.body}>
        {parsed.ok ? (
          parsed.documents.length === 0 ? (
            <Empty />
          ) : (
            <DocumentList documents={parsed.documents} id={id} linkDocuments={linkDocuments} />
          )
        ) : (
          <Guidance problem={parsed.problem} />
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
}: {
  documents: DocumentListDocument[]
  id: string
  linkDocuments: boolean
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
        <DocumentListRow document={document} linkDocuments={linkDocuments} />
      )}
      wrapAround={false}
    />
  )
}

function Notice({children}: {children: ReactNode}) {
  return (
    <Box padding={3} paddingTop={6}>
      {children}
    </Box>
  )
}

function Guidance({problem}: {problem: DocumentListProblem}) {
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
      </Flex>
    </Notice>
  )
}

function unreachable(value: never): never {
  throw new Error(`Unhandled document list problem: ${JSON.stringify(value)}`)
}
