import {LaunchIcon} from '@sanity/icons'
import {Box, Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useId, useState} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useWorkspace} from '../../studio'
import {CreateLearnMoreButton} from '../components/CreateLearnMoreButton'
import {StartInCreateSvg} from '../components/media/StartInCreateSvg'
import {createLocaleNamespace} from '../i18n'
import {getCreateLinkUrl} from '../useCreateDocumentUrl'
import {useGlobalUserId} from '../useGlobalUserId'
import {useSanityCreateTelemetry} from '../useSanityCreateTelemetry'

export interface StartInCreateDialogProps {
  createLinkId: string
  appId: string
  type: string
  onLinkingStarted: (autoConfirm: boolean) => void
  autoConfirm: boolean
}

export function StartInCreateDialog(props: StartInCreateDialogProps) {
  const {createLinkId, appId, type, onLinkingStarted, autoConfirm} = props
  const {t} = useTranslation(createLocaleNamespace)
  const checkboxId = useId()
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const telemetry = useSanityCreateTelemetry()
  const toggleDontShowAgain = useCallback(() => setDontShowAgain((current) => !current), [])

  const {push: pushToast} = useToast()
  const globalUserId = useGlobalUserId()
  const workspace = useWorkspace()

  const createUrl = getCreateLinkUrl({
    projectId: workspace.projectId,
    appId,
    workspaceName: workspace.name,
    documentType: type,
    docId: createLinkId,
    globalUserId: globalUserId,
  })

  const startLinking = useCallback(() => {
    if (!createUrl) {
      pushToast({
        title: t('start-in-create-dialog.error-toast.unresolved-url'),
        status: 'warning',
      })
      return
    }

    window?.open(createUrl, '_blank')?.focus()
    onLinkingStarted(autoConfirm || dontShowAgain)
    telemetry.startInCreateAccepted()
  }, [createUrl, onLinkingStarted, pushToast, t, dontShowAgain, autoConfirm, telemetry])

  useEffect(() => {
    if (autoConfirm && createUrl) {
      startLinking()
    }
  }, [autoConfirm, startLinking, createUrl])

  return (
    <Stack space={4}>
      <Box>
        <StartInCreateSvg />
      </Box>
      <Box>
        <Text weight="semibold">{t('start-in-create-dialog.lede')}</Text>
      </Box>
      <Box>
        <Text>{t('start-in-create-dialog.details')}</Text>
      </Box>
      <Flex gap={2} align="center">
        <Checkbox id={checkboxId} checked={dontShowAgain} onChange={toggleDontShowAgain} />
        <Text as="label" htmlFor={checkboxId}>
          {t('start-in-create-dialog.dont-remind-me-checkbox')}
        </Text>
      </Flex>
      <Flex justify="flex-end" gap={2}>
        <Box>
          <CreateLearnMoreButton />
        </Box>
        <Box>
          <Button
            text={t('start-in-create-dialog.cta.continue')}
            tone="primary"
            iconRight={LaunchIcon}
            onClick={startLinking}
          />
        </Box>
      </Flex>
    </Stack>
  )
}
