import {RestoreIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Checkbox, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {useRouter} from '../../../../../../router'
import {Button} from '../../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../../ui-components/dialog'
import {Translate, useTranslation} from '../../../../../i18n'
import {RevertRelease} from '../../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../../i18n'
import {type ReleaseDocument} from '../../../../store/types'
import {useReleaseOperations} from '../../../../store/useReleaseOperations'
import {createReleaseId} from '../../../../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../../../util/getReleaseIdFromReleaseDocumentId'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'
import {useAdjacentTransactions} from './useAdjacentTransactions'
import {usePostPublishTransactions} from './usePostPublishTransactions'

interface ReleasePublishAllButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

type RevertReleaseStatus = 'idle' | 'confirm' | 'reverting'

const ConfirmReleaseDialog = ({
  revertReleaseStatus,
  documents,
  setRevertReleaseStatus,
  release,
}: {
  revertReleaseStatus: RevertReleaseStatus
  documents: DocumentInRelease[]
  setRevertReleaseStatus: (status: RevertReleaseStatus) => void
  release: ReleaseDocument
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const hasPostPublishTransactions = usePostPublishTransactions(documents)
  const {getAdjacentTransactions} = useAdjacentTransactions(documents)
  const [stageNewRevertRelease, setStageNewRevertRelease] = useState(true)
  const toast = useToast()
  const telemetry = useTelemetry()
  const {createRelease, publishRelease, createVersion} = useReleaseOperations()
  const router = useRouter()

  const navigateToRevertRelease = useCallback(
    (revertReleaseId: string) => () =>
      router.navigate({releaseId: getReleaseIdFromReleaseDocumentId(revertReleaseId)}),
    [router],
  )

  useEffect(() => {
    getAdjacentTransactions()
  }, [getAdjacentTransactions])

  const handleRevertRelease = useCallback(async () => {
    setRevertReleaseStatus('reverting')
    const documentRevertStates = await getAdjacentTransactions()

    const revertReleaseId = createReleaseId()

    try {
      if (!documentRevertStates) {
        throw new Error('Unable to find documents to revert')
      }

      await createRelease({
        _id: revertReleaseId,
        metadata: {
          title: t('revert-release.title', {title: release.metadata.title}),
          description: t('revert-release.description', {title: release.metadata.title}),
          releaseType: 'asap',
        },
      })

      await Promise.allSettled(
        documentRevertStates.map((document) =>
          createVersion(getReleaseIdFromReleaseDocumentId(revertReleaseId), document._id, document),
        ),
      )

      if (stageNewRevertRelease) {
        telemetry.log(RevertRelease, {revertType: 'staged'})
        toast.push({
          closable: true,
          status: 'success',
          title: (
            <Text muted size={1}>
              <Translate
                components={{
                  Link: () => (
                    <Text
                      size={1}
                      weight="medium"
                      data-as="a"
                      onClick={navigateToRevertRelease(revertReleaseId)}
                      style={{
                        cursor: 'pointer',
                        marginBottom: '0.5rem',
                        display: 'flex',
                      }}
                    >
                      {t('toast.revert-stage.success-link')}
                    </Text>
                  ),
                }}
                t={t}
                i18nKey="toast.revert-stage.success"
                values={{title: release.metadata.title}}
              />
            </Text>
          ),
        })
      } else {
        await publishRelease(revertReleaseId)

        telemetry.log(RevertRelease, {revertType: 'immediately'})

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
    setRevertReleaseStatus,
    getAdjacentTransactions,
    createRelease,
    t,
    release.metadata.title,
    stageNewRevertRelease,
    createVersion,
    telemetry,
    toast,
    navigateToRevertRelease,
    publishRelease,
  ])

  const description =
    documents.length > 1
      ? 'revert-dialog.confirm-revert-description_other'
      : 'revert-dialog.confirm-revert-description_one'

  return (
    <Dialog
      id="confirm-revert-dialog"
      header={t('revert-dialog.confirm-revert.title', {title: release.metadata.title})}
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
            i18nKey={description}
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
            <label htmlFor="stage-release">
              {t('revert-dialog.confirm-revert.stage-revert-checkbox-label')}
            </label>
          </Text>
        </Box>
      </Flex>
      {hasPostPublishTransactions && !stageNewRevertRelease && (
        <Card marginTop={4} padding={3} radius={2} shadow={1} tone="critical">
          <Text muted size={1}>
            {t('revert-dialog.confirm-revert.warning-card')}
          </Text>
        </Card>
      )}
    </Dialog>
  )
}

export const ReleaseRevertButton = ({
  release,
  documents,
  disabled,
}: ReleasePublishAllButtonProps) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const [revertReleaseStatus, setRevertReleaseStatus] = useState<RevertReleaseStatus>('idle')

  return (
    <>
      <Button
        icon={RestoreIcon}
        onClick={() => setRevertReleaseStatus('confirm')}
        text={t('action.revert')}
        tone="critical"
        disabled={disabled}
      />
      {revertReleaseStatus !== 'idle' && (
        <ConfirmReleaseDialog
          release={release}
          documents={documents}
          revertReleaseStatus={revertReleaseStatus}
          setRevertReleaseStatus={setRevertReleaseStatus}
        />
      )}
    </>
  )
}
