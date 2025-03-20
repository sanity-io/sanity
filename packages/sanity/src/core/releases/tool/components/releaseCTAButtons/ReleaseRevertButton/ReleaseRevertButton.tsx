import {RestoreIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Checkbox, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../../ui-components/dialog'
import {Translate, useTranslation} from '../../../../../i18n'
import {RevertRelease} from '../../../../__telemetry__/releases.telemetry'
import {useReleasesUpsell} from '../../../../contexts/upsell/useReleasesUpsell'
import {useIsReleasesPlus} from '../../../../hooks/useIsReleasesPlus'
import {releasesLocaleNamespace} from '../../../../i18n'
import {isReleaseLimitError} from '../../../../store/isReleaseLimitError'
import {type ReleaseDocument} from '../../../../store/types'
import {useReleaseOperations} from '../../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../../store/useReleasePermissions'
import {createReleaseId} from '../../../../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseDefaults} from '../../../../util/util'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'
import {useDocumentRevertStates} from './useDocumentRevertStates'
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
  const {t: tCore} = useTranslation()
  const hasPostPublishTransactions = usePostPublishTransactions(documents)
  const getDocumentRevertStates = useDocumentRevertStates(documents)
  const [stageNewRevertRelease, setStageNewRevertRelease] = useState(true)
  const toast = useToast()
  const telemetry = useTelemetry()
  const {revertRelease} = useReleaseOperations()
  const router = useRouter()

  const navigateToRevertRelease = useCallback(
    (revertReleaseId: string) => () =>
      router.navigate({releaseId: getReleaseIdFromReleaseDocumentId(revertReleaseId)}),
    [router],
  )

  const handleRevertRelease = useCallback(async () => {
    setRevertReleaseStatus('reverting')
    const documentRevertStates = await getDocumentRevertStates()

    const revertReleaseId = createReleaseId()

    try {
      if (!documentRevertStates) {
        throw new Error('Unable to find documents to revert')
      }

      await revertRelease(
        revertReleaseId,
        documentRevertStates,
        {
          title: t('revert-release.title', {
            title: release.metadata.title || tCore('release.placeholder-untitled-release'),
          }),
          description: t('revert-release.description', {
            title: release.metadata.title || tCore('release.placeholder-untitled-release'),
          }),
          releaseType: 'asap',
        },
        stageNewRevertRelease ? 'staged' : 'immediate',
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
                values={{
                  title: release.metadata.title || tCore('release.placeholder-untitled-release'),
                }}
              />
            </Text>
          ),
        })
      } else {
        telemetry.log(RevertRelease, {revertType: 'immediate'})

        toast.push({
          closable: true,
          status: 'success',
          title: (
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey="toast.immediate-revert.success"
                values={{
                  title: release.metadata.title || tCore('release.placeholder-untitled-release'),
                }}
              />
            </Text>
          ),
        })
      }
    } catch (revertError) {
      if (isReleaseLimitError(revertError)) return

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
    getDocumentRevertStates,
    revertRelease,
    t,
    tCore,
    release.metadata.title,
    stageNewRevertRelease,
    telemetry,
    toast,
    navigateToRevertRelease,
  ])

  const description =
    documents.length > 1
      ? 'revert-dialog.confirm-revert-description_other'
      : 'revert-dialog.confirm-revert-description_one'

  return (
    <Dialog
      id="confirm-revert-dialog"
      header={t('revert-dialog.confirm-revert.title', {
        title: release.metadata.title || tCore('release.placeholder-untitled-release'),
      })}
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
  const {t: tCore} = useTranslation()
  const {guardWithReleaseLimitUpsell, mode} = useReleasesUpsell()
  const [revertReleaseStatus, setRevertReleaseStatus] = useState<RevertReleaseStatus>('idle')
  const [isPendingGuardResponse, setIsPendingGuardResponse] = useState<boolean>(false)
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)

  const handleMoveToConfirmStatus = useCallback(async () => {
    setIsPendingGuardResponse(true)
    await guardWithReleaseLimitUpsell(() => setRevertReleaseStatus('confirm'))
    setIsPendingGuardResponse(false)
  }, [guardWithReleaseLimitUpsell])

  const isReleasesPlus = useIsReleasesPlus()

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((hasPermissions) => {
      if (isMounted.current) setHasCreatePermission(hasPermissions)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  if (!isReleasesPlus) return null

  return (
    <>
      <Button
        icon={RestoreIcon}
        onClick={handleMoveToConfirmStatus}
        text={t('action.revert')}
        tone="critical"
        tooltipProps={{
          disabled: hasCreatePermission === true,
          content: tCore('release.action.permission.error'),
        }}
        /**
         * This is an immature assertion of permissions
         * The permissions needed to revert are:
         * Permissions to create a request (implemented)
         * @todo Permissions to create each schema type within the release (not implemented)
         */
        disabled={isPendingGuardResponse || !hasCreatePermission || disabled || mode === 'disabled'}
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
