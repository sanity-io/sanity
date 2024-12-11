import {RestoreIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Checkbox, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'

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

interface ReleasePublishAllButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

export const ReleaseRevertButton = ({
  release,
  documents,
  disabled,
}: ReleasePublishAllButtonProps) => {
  const {result, trigger} = useAdjacentTransactions(documents)
  const {documentRevertStates, hasPostPublishTransactions} = result || {}
  const {t} = useTranslation(releasesLocaleNamespace)
  const [revertReleaseStatus, setRevertReleaseStatus] = useState<'idle' | 'confirm' | 'reverting'>(
    'idle',
  )
  const toast = useToast()
  const router = useRouter()
  const telemetry = useTelemetry()
  const [stageNewRevertRelease, setStageNewRevertRelease] = useState(true)
  const {createRelease, publishRelease, createVersion} = useReleaseOperations()

  useEffect(() => {
    if (revertReleaseStatus === 'confirm') {
      trigger()
    }
  }, [revertReleaseStatus, trigger])

  console.log({documentRevertStates, hasPostPublishTransactions})

  const handleRevertRelease = useCallback(async () => {
    if (!documentRevertStates) return

    setRevertReleaseStatus('reverting')
    const revertReleaseId = createReleaseId()

    try {
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
                {t('toast.revert-stage.success-link')}
              </a>
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
    documentRevertStates,
    createRelease,
    t,
    release.metadata.title,
    stageNewRevertRelease,
    createVersion,
    telemetry,
    toast,
    router,
    publishRelease,
  ])

  const confirmReleaseDialog = useMemo(() => {
    if (revertReleaseStatus === 'idle') return null

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
  }, [
    revertReleaseStatus,
    documents.length,
    t,
    release.metadata.title,
    stageNewRevertRelease,
    handleRevertRelease,
    hasPostPublishTransactions,
  ])

  return (
    <>
      <Button
        icon={RestoreIcon}
        onClick={() => setRevertReleaseStatus('confirm')}
        text={t('action.revert')}
        tone="critical"
        disabled={disabled}
      />
      {confirmReleaseDialog}
    </>
  )
}
