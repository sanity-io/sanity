import {type RefObject, useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {type BundleDocument} from '../../../store/bundles/types'
import {releasesLocaleNamespace} from '../../i18n'
import {Table, type TableProps} from '../components/Table/Table'
import {DocumentActions} from './documentTable/DocumentActions'
import {getDocumentTableColumnDefs} from './documentTable/DocumentTableColumnDefs'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {type DocumentInBundleResult} from './useBundleDocuments'

export type DocumentWithHistory = DocumentInBundleResult & {
  history: DocumentHistory | undefined
  // TODO: Get this value from the document, it can be calculated by checking if there is a corresponding document with no version attached
  isAdded?: boolean
}
export type BundleDocumentRow = DocumentWithHistory

export interface ReleaseSummaryProps {
  documents: DocumentInBundleResult[]
  documentsHistory: Record<string, DocumentHistory>
  scrollContainerRef: RefObject<HTMLDivElement>
  release: BundleDocument
}

const getRowProps: TableProps<DocumentWithHistory, undefined>['rowProps'] = (datum) =>
  datum?.validation?.hasError ? {tone: 'critical'} : {}

export function ReleaseSummary(props: ReleaseSummaryProps) {
  const {documents, documentsHistory, release, scrollContainerRef} = props

  const {t} = useTranslation(releasesLocaleNamespace)

  const aggregatedData = useMemo(
    () =>
      documents.map((document) => ({
        ...document,
        history: documentsHistory[document.document._id],
      })),
    [documents, documentsHistory],
  )

  const renderRowActions: ({datum}: {datum: BundleDocumentRow | unknown}) => JSX.Element =
    useCallback(
      ({datum}) => {
        const document = datum as BundleDocumentRow

        return <DocumentActions document={document} bundleTitle={release.title} />
      },
      [release.title],
    )

  const documentTableColumnDefs = useMemo(
    () => getDocumentTableColumnDefs(release._id, t),
    [release._id, t],
  )

  const filterRows = useCallback(
    (data: DocumentWithHistory[], searchTerm: string) =>
      data.filter(({previewValues}) => {
        const title =
          typeof previewValues.values.title === 'string' ? previewValues.values.title : 'Untitled'
        return title.toLowerCase().includes(searchTerm.toLowerCase())
      }),
    [],
  )

  return (
    <>
      <Table<DocumentWithHistory>
        data={aggregatedData}
        emptyState={t('summary.no-documents')}
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="document._id"
        columnDefs={documentTableColumnDefs}
        rowActions={renderRowActions}
        searchFilter={filterRows}
        rowProps={getRowProps}
        scrollContainerRef={scrollContainerRef}
      />
    </>
  )
}
