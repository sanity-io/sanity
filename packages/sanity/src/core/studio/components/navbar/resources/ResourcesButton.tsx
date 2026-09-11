import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {useCallback, useState} from 'react'
import semver from 'semver'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {StatusButton} from '../../../../components/StatusButton'
import {STUDIO_DSN} from '../../../../error/sentry/sentryErrorReporter'
import {StudioFeedbackDialog} from '../../../../feedback/components/StudioFeedbackDialog'
import {useFeedbackAvailable} from '../../../../feedback/hooks/useFeedbackAvailable'
import {useFeedbackTelemetry} from '../../../../feedback/hooks/useFeedbackTelemetry'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useRenderingContext} from '../../../../store/renderingContext/useRenderingContext'
import {useLiveUserApplication} from '../../../liveUserApplication/useLiveUserApplication'
import {usePackageVersionStatus} from '../../../packageVersionStatus/usePackageVersionStatus'
import {DiagnosticsDialog} from './DiagnosticsDialog'
import {DiagnosticsMenuItem} from './DiagnosticsMenuItem'
import {FeedbackMenuItem} from './FeedbackMenuItem'
import {useGetHelpResources} from './helper-functions/hooks'
import {menu} from './ResourcesButton.css'
import {ResourcesMenuItems} from './ResourcesMenuItems'
import {StudioInfoDialog} from './StudioInfoDialog'

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
          <Menu className={menu} data-testid="menu-button-resources">
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
          </Menu>
        }
        popover={{constrainSize: true, tone: 'default'}}
      />
    </>
  )
}
