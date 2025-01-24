import {useTelemetry} from '@sanity/telemetry/react'
import {type BadgeTone, Box, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Preview} from '../../../../preview/components/Preview'
import {CreatedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {type EditableReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {DEFAULT_RELEASE_TYPE} from '../../../util/const'
import {createReleaseId} from '../../../util/createReleaseId'
import {getIsScheduledDateInPast, ReleaseForm} from '../../dialog/ReleaseForm'
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

  const [isScheduledDateInPast, setIsScheduledDateInPast] = useState(() =>
    getIsScheduledDateInPast(release),
  )

  const telemetry = useTelemetry()
  const {createRelease} = useReleaseOperations()

  const displayTitle = title || t('release.placeholder-untitled-release')

  const handleOnChange = useCallback((changedValue: EditableReleaseDocument) => {
    setRelease(changedValue)

    // when the value changes, re-evaluate if the scheduled date is in the past
    setIsScheduledDateInPast(getIsScheduledDateInPast(changedValue))
  }, [])

  const handleAddVersion = useCallback(async () => {
    onCreateVersion(newReleaseId)
  }, [onCreateVersion, newReleaseId])

  const handleCreateRelease = useCallback(async () => {
    if (isScheduledDateInPast) {
      toast.push({
        closable: true,
        status: 'warning',
        title: tRelease('schedule-dialog.publish-date-in-past-warning'),
      })
      return // do not submit if date is in past
    }

    try {
      setIsSubmitting(true)

      await createRelease(release)

      await handleAddVersion()
      telemetry.log(CreatedRelease, {origin: 'document-panel'})
    } catch (err) {
      console.error(err)
      toast.push({
        closable: true,
        status: 'error',
        title: `Failed to create release`,
        description: err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [createRelease, handleAddVersion, isScheduledDateInPast, tRelease, telemetry, toast, release])

  const handleOnMouseEnter = () => setIsScheduledDateInPast(getIsScheduledDateInPast(release))

  return (
    <Dialog
      id={'create-release-dialog'}
      header={'Copy version to new release'}
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
          text: 'Add to release',
          onClick: handleCreateRelease,
          onMouseEnter: handleOnMouseEnter,
          onFocus: handleOnMouseEnter,
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
        <ReleaseForm onChange={handleOnChange} value={release} />
      </Box>
    </Dialog>
  )
}
