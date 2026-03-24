import {FeedbackIcon, HelpCircleIcon} from '@sanity/icons'
import {Menu, MenuDivider} from '@sanity/ui'
import {useCallback, useState} from 'react'
import semver from 'semver'
import {styled} from 'styled-components'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {StatusButton} from '../../../../components'
import {STUDIO_DSN} from '../../../../error/sentry/sentryErrorReporter'
import {FeedbackDialog} from '../../../../feedback'
import {useTranslation} from '../../../../i18n'
import {useLiveUserApplication} from '../../../liveUserApplication/useLiveUserApplication'
import {usePackageVersionStatus} from '../../../packageVersionStatus/usePackageVersionStatus'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'
import {StudioInfoDialog} from './StudioInfoDialog'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {t} = useTranslation()
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
  const handleOpenFeedback = useCallback(() => setFeedbackDialogOpen(true), [])
  const handleCloseFeedback = useCallback(() => setFeedbackDialogOpen(false), [])

  return (
    <>
      {studioInfoDialogOpen && <StudioInfoDialog onClose={handleStudioInfoDialogClose} />}
      {feedbackDialogOpen && (
        <FeedbackDialog
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
          <StyledMenu data-testid="menu-button-resources">
            <MenuItem
              icon={FeedbackIcon}
              text={t('feedback.menu-item')}
              onClick={handleOpenFeedback}
            />
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
