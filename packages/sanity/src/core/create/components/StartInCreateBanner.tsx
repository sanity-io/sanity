import {LaunchIcon, SparklesIcon} from '@sanity/icons'
import {
  Badge,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Card,
  Flex,
  Inline,
  Stack,
  Text,
  useToast,
} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {TextWithTone} from 'sanity'

import {isDev} from '../../environment'
import {useTranslation} from '../../i18n'
import {useWorkspace} from '../../studio'
import {useSanityCreateConfig} from '../context'
import {getCreateLinkUrl} from '../createDocumentUrls'
import {isSanityCreateExcludedType, isSanityCreateStartCompatibleDoc} from '../createUtils'
import {createLocaleNamespace} from '../i18n'
import {CreateLinkingDialog} from '../start-in-create/CreateLinkingDialog'
import {type AppIdCache} from '../studio-app/appIdCache'
import {type CompatibleStudioAppId} from '../studio-app/fetchCreateCompatibleAppId'
import {useStudioAppIdStore} from '../studio-app/useStudioAppIdStore'
import {type StartInCreateBannerProps} from '../types'
import {useSanityCreateTelemetry} from '../useSanityCreateTelemetry'
import {createUserDocumentationUrl} from './constants'
import {DialogPortalProvider} from './DialogPortalProvider'
import {StartInCreateDevInfoButton} from './StartInCreateDevInfoButton'

export function StartInCreateBanner(props: StartInCreateBannerProps) {
  const {document, isInitialValueLoading} = props
  const {appIdCache, startInCreateEnabled} = useSanityCreateConfig()

  const isExcludedByOption = isSanityCreateExcludedType(props.documentType)
  const isNewPristineDoc = !document._createdAt
  const isStartCreateCompatible = isSanityCreateStartCompatibleDoc(props.document)

  if (
    !isNewPristineDoc ||
    !startInCreateEnabled ||
    isExcludedByOption ||
    !appIdCache ||
    !isStartCreateCompatible ||
    isInitialValueLoading
  ) {
    return null
  }

  return <StartInCreateBannerInner {...props} appIdCache={appIdCache} />
}

function StartInCreateBannerInner(props: StartInCreateBannerProps & {appIdCache: AppIdCache}) {
  const {studioApp} = useStudioAppIdStore(props.appIdCache)

  if (!studioApp) {
    return null
  }
  return <StartInCreateBannerStudioApp {...props} studioApp={studioApp} />
}

function StartInCreateBannerStudioApp(
  props: StartInCreateBannerProps & {
    studioApp: CompatibleStudioAppId
  },
) {
  const {documentId, documentType, panelPortalElementId, studioApp} = props
  const appId = studioApp.appId

  const {t} = useTranslation(createLocaleNamespace)
  const telemetry = useSanityCreateTelemetry()
  const workspace = useWorkspace()
  const {push: pushToast} = useToast()

  const [isLinking, setLinking] = useState(false)

  const startLinking = useCallback(() => {
    if (!appId) {
      return
    }

    const createLinkId = documentType.liveEdit ? documentId : `drafts.${documentId}`

    const createUrl = getCreateLinkUrl({
      projectId: workspace.projectId,
      appId,
      workspaceName: workspace.name,
      documentType: documentType.name,
      docId: createLinkId,
    })

    if (!createUrl) {
      pushToast({
        title: t('start-in-create-dialog.error-toast.unresolved-url'),
        status: 'warning',
      })
      return
    }

    window?.open(createUrl, '_blank')?.focus()
    setLinking(true)
    telemetry.linkAccepted()
  }, [pushToast, t, telemetry, appId, workspace, documentType, documentId])

  if (isLinking) {
    return (
      <DialogPortalProvider portalElementId={panelPortalElementId}>
        <CreateLinkingDialog />
      </DialogPortalProvider>
    )
  }

  return (
    <Flex>
      <Card borderTop padding={3} flex={1} tone="primary">
        <Flex justify="space-between" align="center" gap={4}>
          <Flex gap={3} align="flex-start" flex={1} paddingY={1}>
            <Text size={1}>
              <SparklesIcon />
            </Text>
            <Stack space={3}>
              <Flex align="center" gap={2} wrap="wrap">
                <TextWithTone size={1} weight="semibold" tone="primary">
                  {t('start-in-create-banner.title')}
                </TextWithTone>
                <Badge
                  fontSize={1}
                  style={{marginTop: '-0.25em', marginBottom: '-0.25em'}}
                  tone="default"
                >
                  {t('start-in-create-banner.title-badge')}
                </Badge>
              </Flex>
              <Inline>
                <Text size={1} weight="medium">
                  {t('start-in-create-banner.subtitle')}{' '}
                  <a target="_blank" href={createUserDocumentationUrl} rel="noreferrer">
                    {t('start-in-create-dialog.cta.learn-more')}
                  </a>
                </Text>
              </Inline>
            </Stack>
          </Flex>
          <Flex gap={2}>
            {isDev && <StartInCreateDevInfoButton studioApp={studioApp} />}
            <Button
              disabled={!appId}
              iconRight={LaunchIcon}
              onClick={startLinking}
              space={3}
              text={t('start-in-create-link.label')}
              tone="primary"
            />
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
