/* eslint-disable  no-restricted-imports */
// The design of the Studio version menu item doesn't align with the limitations of the
// 'ui-components/menuItem/MenuItem.tsx' since we want both a subtitle and a top right aligned version badge.
import {LaunchIcon} from '@sanity/icons'
import {
  Badge,
  Card,
  type CardTone,
  Flex,
  MenuDivider,
  MenuItem as UIMenuItem,
  Text,
} from '@sanity/ui'
import {Fragment, useCallback} from 'react'
import {type SemVer} from 'semver'

import {MenuItem} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {useTranslation} from '../../../../i18n'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {useLiveUserApplication} from '../../../liveUserApplication/useLiveUserApplication'
import {StudioAnnouncementsMenuItem} from '../../../studioAnnouncements/StudioAnnouncementsMenuItem'
import {useWorkspaces} from '../../../workspaces'
import {type ResourcesResponse, type Section} from './helper-functions/types'
import {useCanDeployStudio} from './useCanDeployStudio'

interface ResourcesMenuItemProps {
  error: Error | null
  isLoading: boolean
  currentVersion: SemVer
  newAutoUpdateVersion?: SemVer
  latestTaggedVersion?: SemVer
  value?: ResourcesResponse
  onOpenStudioVersionDialog: () => void
}

function reload() {
  document.location.reload()
}

export function ResourcesMenuItems({
  error,
  isLoading,
  value,
  latestTaggedVersion,
  currentVersion,
  onOpenStudioVersionDialog,
  newAutoUpdateVersion,
}: ResourcesMenuItemProps) {
  const sections = value?.resources?.sectionArray
  const {t} = useTranslation()
  if (isLoading) {
    return <LoadingBlock showText />
  }

  const fallbackLinks = (
    <>
      <MenuItem
        as="a"
        text={t('help-resources.action.join-our-community')}
        href="https://www.sanity.io/exchange/community"
        target="_blank"
      />
      <MenuItem
        as="a"
        text={t('help-resources.action.help-and-support')}
        href="https://www.sanity.io/contact/support"
        target="_blank"
      />
      <MenuItem
        as="a"
        text={t('help-resources.action.contact-sales')}
        href="https://www.sanity.io/contact/sales?ref=studio"
        target="_blank"
      />
    </>
  )

  return (
    <>
      {/* Studio version information */}
      <StudioVersion
        currentVersion={currentVersion}
        newAutoUpdateVersion={newAutoUpdateVersion}
        latestTaggedVersion={latestTaggedVersion}
        onOpenStudioVersionDialog={onOpenStudioVersionDialog}
      />

      <StudioRegistration />
      <MenuDivider />

      {!error &&
        sections?.map((subSection, i) => {
          if (!subSection) return null
          return (
            <Fragment key={subSection._key}>
              <SubSection subSection={subSection} />
              {i < sections.length - 1 && <MenuDivider />}
            </Fragment>
          )
        })}

      {/* Display fallback values on error / no response */}
      {(value === undefined || error) && <div>{fallbackLinks}</div>}
    </>
  )
}

function StudioVersion({
  currentVersion,
  newAutoUpdateVersion,
  latestTaggedVersion,
  onOpenStudioVersionDialog,
}: {
  currentVersion: SemVer
  newAutoUpdateVersion?: SemVer
  latestTaggedVersion?: SemVer
  onOpenStudioVersionDialog: () => void
}) {
  const {t} = useTranslation()

  const isOutdated = latestTaggedVersion
    ? (currentVersion?.compareMain?.(latestTaggedVersion) ?? 0) < 0
    : false

  let versionTone: CardTone = 'positive'
  let subtitle = t('help-resources.up-to-date')
  let action = onOpenStudioVersionDialog
  let testId = 'menu-item-studio-version'

  if (newAutoUpdateVersion) {
    subtitle = t('help-resources.studio-auto-update-now', {
      newVersion: newAutoUpdateVersion.version,
    })
    versionTone = 'caution'
    action = reload
    testId = 'menu-item-update-studio-now'
  } else if (isOutdated) {
    subtitle = t('help-resources.latest-sanity-version', {
      latestVersion: latestTaggedVersion?.version,
    })
    versionTone = 'caution'
  }

  return (
    <UIMenuItem padding={2} onClick={action} data-testid={testId}>
      <Flex align="flex-start">
        <Flex direction="column" flex={1} gap={2} padding={1}>
          <Text size={1} weight="medium">
            {t('help-resources.studio')}
          </Text>
          <Text muted size={1}>
            {subtitle}
          </Text>
        </Flex>

        <Badge tone={versionTone}>
          {t('help-resources.version', {version: currentVersion.version})}
        </Badge>
      </Flex>
    </UIMenuItem>
  )
}

function StudioRegistration() {
  const {t} = useTranslation()
  const {userApplication} = useLiveUserApplication()
  const sanityWebsiteUrl = useEnvAwareSanityWebsiteUrl()
  const workspaces = useWorkspaces()
  const projectId = workspaces[0]?.projectId
  const canDeployStudio = useCanDeployStudio(!userApplication)

  const handleRegisterStudio = useCallback(() => {
    if (!projectId || !canDeployStudio) return
    const url = new URL(`${sanityWebsiteUrl}/manage/project/${projectId}/studios`)
    url.searchParams.set('studio', 'add')
    url.searchParams.set('origin', window.location.origin)
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [projectId, sanityWebsiteUrl, canDeployStudio])

  if (userApplication) {
    return null
  }

  return (
    <Card tone="caution" radius={4}>
      <MenuItem
        text={t('help-resources.register-studio')}
        iconRight={<LaunchIcon />}
        onClick={handleRegisterStudio}
        tone="caution"
        disabled={!canDeployStudio}
      />
    </Card>
  )
}

function SubSection({subSection}: {subSection: Section}) {
  return (
    <>
      {subSection?.items?.map((item) => {
        if (!item || !item.title) return null
        switch (item._type) {
          case 'externalLink':
            if (!item.url) return null
            return (
              <MenuItem
                key={item._key}
                as="a"
                tone="default"
                text={item.title}
                href={item.url}
                target="_blank"
              />
            )
          case 'internalAction': // TODO: Add support for internal actions (MVI-2)
            if (!item.type) return null
            if (item.type === 'studio-announcements-modal')
              return <StudioAnnouncementsMenuItem key={item._key} text={item.title} />
            return (
              item.type === 'show-welcome-modal' && <MenuItem key={item._key} text={item.title} />
            )

          default:
            return null
        }
      })}
    </>
  )
}
