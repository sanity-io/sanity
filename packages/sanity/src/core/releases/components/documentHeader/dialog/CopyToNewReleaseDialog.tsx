import {type EditableReleaseDocument} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Flex, Text, useToast} from '@sanity/ui'
import {type ElementTone} from '@sanity/ui/theme'
import {useCallback, useState} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Preview} from '../../../../preview/components/Preview'
import {CreatedRelease} from '../../../__telemetry__/releases.telemetry'
import {useCreateReleaseMetadata} from '../../../hooks/useCreateReleaseMetadata'
import {useGuardWithReleaseLimitUpsell} from '../../../hooks/useGuardWithReleaseLimitUpsell'
import {useReleaseFormStorage} from '../../../hooks/useReleaseFormStorage'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseLimitError} from '../../../store/isReleaseLimitError'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {DEFAULT_RELEASE_TYPE} from '../../../util/const'
import {createReleaseId} from '../../../util/createReleaseId'
import {getIsReleaseInvalid} from '../../../util/getIsReleaseInvalid'
import {getIsScheduledDateInPast} from '../../../util/getIsScheduledDateInPast'
import {ReleaseForm} from '../../dialog/ReleaseForm'
import {ReleaseAvatar} from '../../ReleaseAvatar'

export function CopyToNewReleaseDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
  tone: ElementTone
  title: string
  onCreateVersion: (releaseId: string) => void
}): React.JSX.Element {
  const {onClose, documentId, documentType, tone, title, onCreateVersion} = props
  const {t} = useTranslation()
  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const toast = useToast()
  const createReleaseMetadata = useCreateReleaseMetadata()
  const {releasePromise} = useGuardWithReleaseLimitUpsell()

  const schema = useSchema()
  const schemaType = schema.get(documentType)

  const [newReleaseId] = useState(createReleaseId)

  const [release, setRelease] = useState((): EditableReleaseDocument => {
    return {
      _id: newReleaseId,
      metadata: {
        title: '',
        description: '',
        releaseType: DEFAULT_RELEASE_TYPE,
      },
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  /**
   * This state supports the scenario of:
   * release.intendedPublishAt is set to a valid future date; but at time of submit it is in the past
   * Without an update on this state, CopyToNewReleaseDialog would not rerender
   * and so date in past warning ui elements wouldn't show
   */
  const [, setRerenderDialog] = useState(0)

  const telemetry = useTelemetry()
  const {createRelease} = useReleaseOperations()
  const {clearReleaseDataFromStorage} = useReleaseFormStorage()

  const displayTitle = title || t('release.placeholder-untitled-release')

  const isScheduledDateInPast = getIsScheduledDateInPast(release)
  const invalid = getIsReleaseInvalid(release)

  const handleOnChange = useCallback((releaseMetadata: EditableReleaseDocument) => {
    setRelease(releaseMetadata)
  }, [])

  const handleAddVersion = useCallback(async () => {
    onCreateVersion(newReleaseId)
  }, [onCreateVersion, newReleaseId])

  const handleCreateRelease = useCallback(async () => {
    // re-evaluate if date is in past
    // as dialog could have been left idle for a while
    if (getIsScheduledDateInPast(release)) {
      setRerenderDialog((cur) => cur + 1)
      return // do not submit if date is in past
    }

    setIsSubmitting(true)
    const inQuota = await releasePromise

    if (!inQuota) {
      setIsSubmitting(false)
      return
    }

    try {
      const releaseValue = createReleaseMetadata(release)

      await createRelease(releaseValue)

      await handleAddVersion()
      telemetry.log(CreatedRelease, {origin: 'document-panel'})
    } catch (err) {
      if (isReleaseLimitError(err)) {
        onClose()
      } else {
        console.error(err)
        toast.push({
          closable: true,
          status: 'error',
          title: t('release.toast.create-release-error.title'),
          description: err.message,
        })
      }
    } finally {
      setIsSubmitting(false)
      clearReleaseDataFromStorage()
    }
  }, [
    release,
    releasePromise,
    createReleaseMetadata,
    createRelease,
    handleAddVersion,
    telemetry,
    onClose,
    toast,
    t,
    clearReleaseDataFromStorage,
  ])

  const handleOnClose = useCallback(() => {
    clearReleaseDataFromStorage()
    onClose()
  }, [clearReleaseDataFromStorage, onClose])

  return (
    <Dialog
      id={'create-release-dialog'}
      header={t('release.dialog.copy-to-release.title')}
      onClickOutside={onClose}
      onClose={handleOnClose}
      padding={false}
      width={1}
    >
      <Box borderBottom paddingX={2} marginBottom={2}>
        <Flex align="center" padding={4} paddingTop={1} justify="space-between">
          {schemaType ? (
            <Preview value={{_id: documentId}} schemaType={schemaType} />
          ) : (
            <LoadingBlock />
          )}

          <Flex
            align="center"
            border
            gap={2}
            padding={1}
            paddingRight={2}
            overflow="hidden"
            radius="full"
            style={{
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            <ReleaseAvatar padding={1} tone={tone} />
            <Text size={1} title={displayTitle}>
              {displayTitle}
            </Text>
          </Flex>
        </Flex>
      </Box>

      <Box paddingX={5} paddingY={3}>
        {isScheduledDateInPast && (
          <Card padding={3} marginBottom={3} radius={2} shadow={1} tone="critical">
            <Text size={1}>{t('release.schedule-dialog.publish-date-in-past-warning')}</Text>
          </Card>
        )}
        <ReleaseForm onChange={handleOnChange} value={release} />

        <Flex width="fill" gap={3} justify="flex-end" paddingTop={3} align="center">
          <Button
            disabled={isSubmitting}
            text={t('common.dialog.cancel-button.text')}
            data-testid="cancel-button"
            onClick={onClose}
            mode="bleed"
          />
          <Button
            disabled={isSubmitting || isScheduledDateInPast || invalid}
            type="submit"
            onClick={handleCreateRelease}
            text={t('release.action.add-to-new-release')}
            loading={isSubmitting}
            tone="primary"
            data-testid="confirm-button"
          />
        </Flex>
      </Box>
    </Dialog>
  )
}
