import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {lazy, Suspense, useCallback, useState} from 'react'
import semver from 'semver'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {StatusButton} from '../../../../components/StatusButton'
import {STUDIO_DSN} from '../../../../error/sentry/sentryErrorReporter'
import {useFeedbackAvailable} from '../../../../feedback/hooks/useFeedbackAvailable'
import {useFeedbackTelemetry} from '../../../../feedback/hooks/useFeedbackTelemetry'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useRenderingContext} from '../../../../store/renderingContext/useRenderingContext'
import {useLiveUserApplication} from '../../../liveUserApplication/useLiveUserApplication'
import {usePackageVersionStatus} from '../../../packageVersionStatus/usePackageVersionStatus'
import {DiagnosticsMenuItem} from './DiagnosticsMenuItem'
import {FeedbackMenuItem} from './FeedbackMenuItem'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

// The dialogs behind the help menu are only needed after a click, so they load on demand
// instead of shipping with the navbar.
const DiagnosticsDialog = lazy(() =>
  import('./DiagnosticsDialog').then((module) => ({default: module.DiagnosticsDialog})),
)
const StudioFeedbackDialog = lazy(() =>
  import('../../../../feedback/components/StudioFeedbackDialog').then((module) => ({
    default: module.StudioFeedbackDialog,
  })),
)
const StudioInfoDialog = lazy(() =>
  import('./StudioInfoDialog').then((module) => ({default: module.StudioInfoDialog})),
)

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {t} = useTranslation()
  const renderingContext = useRenderingContext()
  const isInDashboard = renderingContext?.name === 'coreUi'
  const feedbackAvailable = useFeedbackAvailable({dsn: STUDIO_DSN, skip: isInDashboard})
  const {userApplication, isLoading: isLoadingUserApplication} = useLiveUserApplication()

  const {value, error, isLoading} = useGetHelpResources()

  const {
    autoUpdatingVersion: autoUpdatingVersionStr,
    currentVersion: currentVersionStr,
    latestTaggedVersion: latestTaggedVersionStr,
  } = usePackageVersionStatus()

  const currentVersion = semver.parse(currentVersionStr)!
  const autoUpdatingVersion = semver.parse(autoUpdatingVersionStr) || undefined
  const latestTaggedVersion = semver.parse(latestTaggedVersionStr) || undefined

  const newAutoUpdateVersionAvailable =
    currentVersion && autoUpdatingVersion ? semver.neq(currentVersion, autoUpdatingVersion) : false

  const getButtonTone = () => {
    if (newAutoUpdateVersionAvailable) return 'primary'
    if (!isLoadingUserApplication && !userApplication) return 'caution'
    return undefined
  }

  const [studioInfoDialogOpen, setStudioInfoDialogOpen] = useState(false)
  const handleStudioInfoDialogClose = useCallback(() => {
    setStudioInfoDialogOpen(false)
  }, [])

  const handleOpenVersionDialog = useCallback(() => {
    setStudioInfoDialogOpen(true)
  }, [])

  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const {feedbackDialogOpened} = useFeedbackTelemetry()
  const handleOpenFeedback = useCallback(() => {
    feedbackDialogOpened()
    setFeedbackDialogOpen(true)
  }, [feedbackDialogOpened])
  const handleCloseFeedback = useCallback(() => setFeedbackDialogOpen(false), [])

  const [diagnosticsDialogOpen, setDiagnosticsDialogOpen] = useState(false)
  const handleOpenDiagnostics = useCallback(() => setDiagnosticsDialogOpen(true), [])
  const handleCloseDiagnostics = useCallback(() => setDiagnosticsDialogOpen(false), [])

  return (
    <>
      <Suspense fallback={null}>
        {studioInfoDialogOpen && <StudioInfoDialog onClose={handleStudioInfoDialogClose} />}
        {diagnosticsDialogOpen && <DiagnosticsDialog onClose={handleCloseDiagnostics} />}
        {feedbackDialogOpen && (
          <StudioFeedbackDialog
            dsn={STUDIO_DSN}
            feedbackVersion="1"
            source="studio-help-menu"
            onClose={handleCloseFeedback}
          />
        )}
      </Suspense>
      <MenuButton
        button={
          <StatusButton
            tone={getButtonTone()}
            aria-label={t('help-resources.title')}
            icon={HelpCircleIcon}
            data-testid="button-resources-menu"
            mode="bleed"
            tooltipProps={{content: t('help-resources.title')}}
          />
        }
        id="menu-button-resources"
        menu={
          <StyledMenu data-testid="menu-button-resources">
            {!isInDashboard && feedbackAvailable && (
              <FeedbackMenuItem onClick={handleOpenFeedback} />
            )}
            <DiagnosticsMenuItem onClick={handleOpenDiagnostics} />
            <MenuDivider />
            <ResourcesMenuItems
              currentVersion={currentVersion}
              latestTaggedVersion={latestTaggedVersion}
              newAutoUpdateVersion={newAutoUpdateVersionAvailable ? autoUpdatingVersion : undefined}
              error={error}
              isLoading={isLoading}
              value={value}
              onOpenStudioVersionDialog={handleOpenVersionDialog}
            />
          </StyledMenu>
        }
        popover={{constrainSize: true, tone: 'default'}}
      />
    </>
  )
}
