import {RestoreIcon} from '@sanity/icons'
import {Box, Card, Checkbox, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, filter, forkJoin, from, map, of, switchMap} from 'rxjs'

import {useRouter} from '../../../../../router'
import {Button} from '../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../ui-components/dialog'
import {useClient} from '../../../../hooks/useClient'
import {Translate, useTranslation} from '../../../../i18n'
import {getTransactionsLogs} from '../../../../store/translog/getTransactionLogs'
import {API_VERSION} from '../../../../tasks/constants'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {createReleaseId} from '../../../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleasePublishAllButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

const useGetAdjacentTransactions = (documents: DocumentInRelease[]) => {
  const client = useClient({apiVersion: API_VERSION})
  const observableClient = client.observable
  const transactionId = documents[0]?.document._rev
  const {dataset} = client.config()

  const hasPostPublishTransactions$ = useMemo(
    () =>
      from(
        getTransactionsLogs(
          client,
          documents.map(({document}) => document._id),
          {
            fromTransaction: transactionId,
            // one transaction for every document plus the publish transaction
            limit: 2,
          },
        ),
      ).pipe(
        // the transaction of published is also returned
        // so post publish transactions will result in more than 1 transaction
        map((transactions) => transactions.length > 1),
      ),
    [client, documents, transactionId],
  )

  const revertToDocuments$ = useMemo(
    () =>
      from(
        getTransactionsLogs(
          client,
          documents.map(({document}) => document._id),
          {
            toTransaction: transactionId,
            // one transaction for every document plus the publish transaction
            limit: documents.length + 1,
            // // reverse to find the transactions immediately before publish
            reverse: true,
          },
        ),
      ).pipe(
        filter((transactions) => transactions.length > 0),
        map(([publishTransaction, ...otherTransactions]) => otherTransactions),
        map((transactions) =>
          documents.map(({document}) => ({
            docId: document._id,
            // eslint-disable-next-line max-nested-callbacks
            revisionId: transactions.find(({documentIDs}) => documentIDs.includes(document._id))
              ?.id,
          })),
        ),
        switchMap((docRevisionPairs) =>
          forkJoin(
            docRevisionPairs.map(({docId, revisionId}) => {
              if (!revisionId) {
                const {publishedDocumentExists, ...unpublishDocument} =
                  // eslint-disable-next-line max-nested-callbacks
                  documents.find(({document}) => document._id === docId)?.document || {}

                return of({
                  _id: docId,
                  ...unpublishDocument,
                  _system: {delete: true},
                })
              }

              return (
                observableClient
                  .request<{documents: DocumentInRelease['document'][]}>({
                    url: `/data/history/${dataset}/documents/${docId}?revision=${revisionId}`,
                  })
                  // eslint-disable-next-line max-nested-callbacks
                  .pipe(map((response) => response.documents[0]))
              )
            }),
          ),
        ),
      ),
    [client, dataset, documents, observableClient, transactionId],
  )

  const memoObservable = useMemo(
    () =>
      combineLatest([hasPostPublishTransactions$, revertToDocuments$]).pipe(
        map(([hasPostPublishTransactions, revertToDocuments]) => ({
          hasPostPublishTransactions,
          revertToDocuments,
        })),
      ),
    [hasPostPublishTransactions$, revertToDocuments$],
  )

  return useObservable(memoObservable, {
    hasPostPublishTransactions: null,
    revertToDocuments: null,
  })
}

export const ReleaseRevertButton = ({
  release,
  documents,
  disabled,
}: ReleasePublishAllButtonProps) => {
  const {hasPostPublishTransactions, revertToDocuments} = useGetAdjacentTransactions(documents)
  const {t} = useTranslation(releasesLocaleNamespace)
  const [revertReleaseStatus, setRevertReleaseStatus] = useState<'idle' | 'confirm' | 'reverting'>(
    'idle',
  )
  const toast = useToast()
  const router = useRouter()
  const [stageNewRevertRelease, setStageNewRevertRelease] = useState(true)
  const {createRelease, publishRelease, createVersion} = useReleaseOperations()

  const handleRevertRelease = useCallback(async () => {
    if (!revertToDocuments) return

    setRevertReleaseStatus('reverting')
    const revertReleaseId = createReleaseId()

    try {
      await createRelease({
        _id: revertReleaseId,
        metadata: {
          title: `Reverting "${release.metadata.title}"`,
          description: `This release reverts the changes made in "${release.metadata.title}"`,
          releaseType: 'asap',
        },
      })

      await Promise.allSettled(
        revertToDocuments.map((document) =>
          createVersion(getReleaseIdFromReleaseDocumentId(revertReleaseId), document._id, document),
        ),
      )

      if (stageNewRevertRelease) {
        toast.push({
          closable: true,
          status: 'success',
          title: (
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey="toast.revert-stage.success"
                values={{title: release.metadata.title}}
              />
            </Text>
          ),
          description: (
            <Text size={1} weight="medium">
              <a
                onClick={() =>
                  router.navigate({releaseId: getReleaseIdFromReleaseDocumentId(revertReleaseId)})
                }
                style={{cursor: 'pointer'}}
              >
                View revert release
              </a>
            </Text>
          ),
        })
      } else {
        await publishRelease(revertReleaseId)

        toast.push({
          closable: true,
          status: 'success',
          title: (
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey="toast.immediate-revert.success"
                values={{title: release.metadata.title}}
              />
            </Text>
          ),
        })
      }
    } catch (revertError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate t={t} i18nKey="toast.revert.error" values={{error: revertError.message}} />
          </Text>
        ),
      })
      console.error(revertError)
    } finally {
      setRevertReleaseStatus('idle')
    }
  }, [
    createRelease,
    createVersion,
    publishRelease,
    release.metadata.title,
    revertToDocuments,
    router,
    stageNewRevertRelease,
    t,
    toast,
  ])

  const confirmReleaseDialog = useMemo(() => {
    if (revertReleaseStatus === 'idle') return null

    return (
      <Dialog
        id="confirm-revert-dialog"
        header={t('revert-dialog.confirm-revert.title')}
        onClose={() => setRevertReleaseStatus('idle')}
        footer={{
          confirmButton: {
            text: t(
              stageNewRevertRelease
                ? 'action.create-revert-release'
                : 'action.immediate-revert-release',
            ),
            tone: 'positive',
            onClick: handleRevertRelease,
            loading: revertReleaseStatus === 'reverting',
            disabled: revertReleaseStatus === 'reverting',
          },
        }}
      >
        <Text muted size={1}>
          {
            <Translate
              t={t}
              i18nKey="revert-dialog.confirm-revert-description"
              values={{
                releaseDocumentsLength: documents.length,
              }}
            />
          }
        </Text>
        <Flex align="center" paddingTop={4}>
          <Checkbox
            onChange={() => setStageNewRevertRelease((current) => !current)}
            id="stage-release"
            style={{display: 'block'}}
            checked={stageNewRevertRelease}
          />
          <Box flex={1} paddingLeft={3}>
            <Text muted size={1}>
              <label htmlFor="stage-release">Stage revert actions in a new release</label>
            </Text>
          </Box>
        </Flex>
        {hasPostPublishTransactions && !stageNewRevertRelease && (
          <Card marginTop={4} padding={3} radius={2} shadow={1} tone="critical">
            <Text muted size={1}>
              Changes were made to documents in this release after they were published. Reverting
              will revert all changes
            </Text>
          </Card>
        )}
      </Dialog>
    )
  }, [
    revertReleaseStatus,
    t,
    stageNewRevertRelease,
    handleRevertRelease,
    documents.length,
    hasPostPublishTransactions,
  ])

  return (
    <>
      <Button
        icon={RestoreIcon}
        onClick={() => setRevertReleaseStatus('confirm')}
        text="Revert release"
        tone="critical"
        disabled={disabled}
      />
      {confirmReleaseDialog}
    </>
  )
}
