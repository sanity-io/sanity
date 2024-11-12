import {LaunchIcon} from '@sanity/icons'
import {Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useId, useState} from 'react'
import {useTranslation} from 'react-i18next'

import {Button} from '../../../ui-components'
import {useWorkspace} from '../../studio'
import {CreateLearnMoreButton} from '../components/CreateLearnMoreButton'
import {getCreateLinkUrl} from '../createDocumentUrls'
import {createLocaleNamespace} from '../i18n'
import {useSanityCreateTelemetry} from '../useSanityCreateTelemetry'

interface StartInCreateActionFooterProps {
  createLinkId: string
  appId: string
  type: string
  onLinkingStarted: (autoConfirm: boolean) => void
  autoConfirm: boolean
}

export function StartInCreateActionFooter(props: StartInCreateActionFooterProps) {
  const {createLinkId, appId, type, onLinkingStarted, autoConfirm} = props
  const {t} = useTranslation(createLocaleNamespace)
  const checkboxId = useId()
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const telemetry = useSanityCreateTelemetry()
  const toggleDontShowAgain = useCallback(() => setDontShowAgain((current) => !current), [])

  const {push: pushToast} = useToast()
  const workspace = useWorkspace()

  const createUrl = getCreateLinkUrl({
    projectId: workspace.projectId,
    appId,
    workspaceName: workspace.name,
    documentType: type,
    docId: createLinkId,
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
    telemetry.linkAccepted()
  }, [createUrl, onLinkingStarted, pushToast, t, dontShowAgain, autoConfirm, telemetry])

  useEffect(() => {
    if (autoConfirm && createUrl) {
      startLinking()
    }
  }, [autoConfirm, startLinking, createUrl])

  return (
    <Stack space={4}>
      <Flex gap={2} align="center">
        <Checkbox id={checkboxId} checked={dontShowAgain} onChange={toggleDontShowAgain} />
        <Text as="label" htmlFor={checkboxId} muted size={1}>
          {t('start-in-create-dialog.dont-remind-me-checkbox')}
        </Text>
      </Flex>
      <Flex justify="flex-end" gap={2}>
        <CreateLearnMoreButton />
        <Button
          text={t('start-in-create-dialog.cta.continue')}
          tone="primary"
          iconRight={LaunchIcon}
          onClick={startLinking}
        />
      </Flex>
    </Stack>
  )
}
