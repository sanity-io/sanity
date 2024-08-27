import {DocumentsIcon} from '@sanity/icons'
import {AvatarStack, Box, Flex, Heading, Stack, Text, useToast} from '@sanity/ui'
import {type RefObject, useCallback, useEffect, useMemo, useState} from 'react'

import {
  BundleIconEditorPicker,
  type BundleIconEditorPickerValue,
} from '../../../bundles/components/dialog/BundleIconEditorPicker'
import {RelativeTime} from '../../../components/RelativeTime'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {Translate, useTranslation} from '../../../i18n'
import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {Chip} from '../../components/Chip'
import {Table, type TableProps} from '../../components/Table/Table'
import {releasesLocaleNamespace} from '../../i18n'
import {DocumentActions} from './documentTable/DocumentActions'
import {getDocumentTableColumnDefs} from './documentTable/DocumentTableColumnDefs'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {type DocumentInBundleResult} from './useBundleDocuments'

export type DocumentWithHistory = DocumentInBundleResult & {
  history: DocumentHistory | undefined
}
export type BundleDocumentRow = DocumentWithHistory

export interface ReleaseSummaryProps {
  documents: DocumentInBundleResult[]
  documentsHistory: Record<string, DocumentHistory>
  collaborators: string[]
  scrollContainerRef: RefObject<HTMLDivElement>
  release: BundleDocument
}

const setIconHue = ({hue, icon}: {hue: BundleDocument['hue']; icon: BundleDocument['icon']}) => ({
  hue: hue ?? 'gray',
  icon: icon ?? 'documents',
})

const getRowProps: TableProps<DocumentWithHistory, undefined>['rowProps'] = (datum) =>
  datum?.validation?.hasError ? {tone: 'critical'} : {}

export function ReleaseSummary(props: ReleaseSummaryProps) {
  const {documents, documentsHistory, release, collaborators, scrollContainerRef} = props
  const {hue, icon} = release

  const {t} = useTranslation(releasesLocaleNamespace)
  const {updateBundle} = useBundleOperations()

  const [iconValue, setIconValue] = useState<BundleIconEditorPickerValue>(setIconHue({hue, icon}))
  const toast = useToast()
  const handleIconValueChange = useCallback(
    async (value: {hue: BundleDocument['hue']; icon: BundleDocument['icon']}) => {
      setIconValue(value)
      try {
        await updateBundle({...value, _id: release._id})
      } catch (e) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('failed-edit-title'),
        })
      }
    },
    [release._id, t, toast, updateBundle],
  )

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
    () => getDocumentTableColumnDefs(release.slug, t),
    [release.slug, t],
  )
  // update hue and icon when release changes
  useEffect(() => setIconValue(setIconHue({hue, icon})), [hue, icon])

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
      <Stack space={4} data-testid="summary" paddingTop={6} paddingBottom={5}>
        <Flex>
          <BundleIconEditorPicker onChange={handleIconValueChange} value={iconValue} />
        </Flex>

        <Heading size={2} style={{margin: '1px 0'}} as="h1">
          {release.title}
        </Heading>

        {release.description && (
          <Text muted size={2} style={{maxWidth: 600}}>
            {release.description}
          </Text>
        )}

        <Flex>
          <Flex flex={1} gap={2}>
            <Chip
              text={<>{t('summary.document-count', {count: documents.length})}</>}
              icon={
                <Text size={1}>
                  <DocumentsIcon />
                </Text>
              }
            />

            {/* Created */}
            <Chip
              avatar={<UserAvatar size={0} user={release.authorId} />}
              data-testid="release-created"
              text={
                <span>
                  <Translate
                    t={t}
                    i18nKey="summary.created"
                    components={{
                      RelativeTime: () => (
                        <RelativeTime time={release._createdAt} useTemporalPhrase />
                      ),
                    }}
                  />
                </span>
              }
            />

            {/* Published */}
            {
              <Chip
                avatar={
                  release.publishedBy ? <UserAvatar size={0} user={release.publishedBy} /> : null
                }
                text={
                  release.publishedAt ? (
                    <span>
                      <Translate
                        t={t}
                        i18nKey={'summary.published'}
                        components={{
                          RelativeTime: () =>
                            release.publishedAt && (
                              <RelativeTime time={release.publishedAt} useTemporalPhrase />
                            ),
                        }}
                      />
                    </span>
                  ) : (
                    t('summary.not-published')
                  )
                }
              />
            }

            {/* Contributors */}
            <Box padding={1}>
              {collaborators?.length > 0 && (
                <AvatarStack size={0} style={{margin: -1}}>
                  {collaborators?.map((userId) => <UserAvatar key={userId} user={userId} />)}
                </AvatarStack>
              )}
            </Box>
          </Flex>
        </Flex>
      </Stack>

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

      <div>
        {aggregatedData.map(
          (document) =>
            document.validation.hasError && (
              <div key={document.document._id}>
                <Text>{document.document._id}</Text>
                {document.validation.validation.map((error) => (
                  <div key={error.path.toString()}>{error.message}</div>
                ))}
              </div>
            ),
        )}
      </div>
    </>
  )
}
