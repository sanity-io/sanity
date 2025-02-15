import {useTelemetry} from '@sanity/telemetry/react'
import {type BadgeTone, Box, Card, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Preview} from '../../../../preview/components/Preview'
import {CreatedRelease} from '../../../__telemetry__/releases.telemetry'
import {useCreateReleaseMetadata} from '../../../hooks/useCreateReleaseMetadata'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseLimitError} from '../../../store/isReleaseLimitError'
import {type EditableReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {DEFAULT_RELEASE_TYPE} from '../../../util/const'
import {createReleaseId} from '../../../util/createReleaseId'
import {getIsScheduledDateInPast} from '../../../util/getIsScheduledDateInPast'
import {ReleaseForm} from '../../dialog/ReleaseForm'
import {ReleaseAvatar} from '../../ReleaseAvatar'

export function CopyToNewReleaseDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
  tone: BadgeTone
  title: string
  onCreateVersion: (releaseId: string) => void
}): React.JSX.Element {
  const {onClose, documentId, documentType, tone, title, onCreateVersion} = props
  const {t} = useTranslation()
  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const toast = useToast()
  const createReleaseMetadata = useCreateReleaseMetadata()

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

  const displayTitle = title || t('release.placeholder-untitled-release')

  const isScheduledDateInPast = getIsScheduledDateInPast(release)

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

    try {
      setIsSubmitting(true)

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
    }
  }, [
    release,
    createReleaseMetadata,
    createRelease,
    handleAddVersion,
    telemetry,
    onClose,
    toast,
    t,
  ])

  return (
    <Dialog
      id={'create-release-dialog'}
      header={t('release.dialog.copy-to-release.title')}
      onClickOutside={onClose}
      onClose={onClose}
      padding={false}
      width={1}
      footer={{
        cancelButton: {
          disabled: isSubmitting,
          onClick: onClose,
        },
        confirmButton: {
          text: t('release.action.add-to-new-release'),
          onClick: handleCreateRelease,
          disabled: isSubmitting || isScheduledDateInPast,
          tone: 'primary',
        },
      }}
    >
      <Box
        paddingX={2}
        marginBottom={2}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
      >
        <Flex align="center" padding={4} paddingTop={1} justify="space-between">
          {schemaType ? (
            <Preview value={{_id: documentId}} schemaType={schemaType} />
          ) : (
            <LoadingBlock />
          )}

          <Flex
            align="center"
            gap={2}
            padding={1}
            paddingRight={2}
            style={{
              borderRadius: 999,
              border: '1px solid var(--card-border-color)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
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
            <Text size={1}>{tRelease('schedule-dialog.publish-date-in-past-warning')}</Text>
          </Card>
        )}
        <ReleaseForm onChange={handleOnChange} value={release} />
      </Box>
    </Dialog>
  )
}
