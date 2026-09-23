/* oxlint-disable  no-restricted-imports */
// The design of the Studio version menu item doesn't align with the limitations of the
// 'ui-components/menuItem/MenuItem.tsx' since we want both a subtitle and a top right aligned version badge.
import {LaunchIcon} from '@sanity/icons/Launch'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Card, type CardTone, Text} from '@sanity/ui'
import {MenuDivider, MenuItem as UIMenuItem} from '@sanity/ui/menu'
import {Fragment, useCallback} from 'react'
import {type SemVer} from 'semver'
import {Flex} from 'ui5'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {TextWithTone} from '../../../../components/textWithTone/TextWithTone'
import {isDev} from '../../../../environment'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {useLiveUserApplication} from '../../../liveUserApplication/useLiveUserApplication'
import {StudioAnnouncementsMenuItem} from '../../../studioAnnouncements/StudioAnnouncementsMenuItem'
import {useWorkspaces} from '../../../workspaces/useWorkspaces'
import {type ResourcesResponse, type Section} from './helper-functions/types'
import {useCanDeployStudio} from './useCanDeployStudio'

interface ResourcesMenuItemProps {
  error: Error | null
  isLoading: boolean
  currentVersion: SemVer
  newAutoUpdateVersion?: SemVer
  latestTaggedVersion?: SemVer
  /** A deprecated version the user should be warned about (running, or pinned to) */
  deprecatedVersion?: SemVer
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
  deprecatedVersion,
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
        deprecatedVersion={deprecatedVersion}
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
  deprecatedVersion,
  onOpenStudioVersionDialog,
}: {
  currentVersion: SemVer
  newAutoUpdateVersion?: SemVer
  latestTaggedVersion?: SemVer
  deprecatedVersion?: SemVer
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

  if (deprecatedVersion) {
    // a reload won't fix this (not auto-updating, or pinned to the deprecated version), so send
    // the user to the dialog which explains what to do
    subtitle = t('help-resources.studio-version-deprecated', {version: deprecatedVersion.version})
    versionTone = 'caution'
    testId = 'menu-item-studio-version-deprecated'
  } else if (newAutoUpdateVersion) {
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

  const menuItem = (
    <UIMenuItem padding={2} onClick={action} data-testid={testId}>
      <Flex alignItems="flex-start">
        <Flex flexDirection="column" flexBasis="0%" flexGrow={1} gap={2} padding={1}>
          <Text size={1} weight="medium">
            {t('help-resources.studio')}
          </Text>
          {deprecatedVersion ? (
            <Flex alignItems="center" gap={2}>
              <TextWithTone size={1} tone="caution">
                <WarningOutlineIcon />
              </TextWithTone>
              <TextWithTone size={1} tone="caution">
                {subtitle}
              </TextWithTone>
            </Flex>
          ) : (
            <Text muted size={1}>
              {subtitle}
            </Text>
          )}
        </Flex>

        <Badge tone={versionTone}>
          {t('help-resources.version', {version: currentVersion.version})}
        </Badge>
      </Flex>
    </UIMenuItem>
  )

  // same caution treatment as the "Register studio" item below
  return deprecatedVersion ? (
    <Card tone="caution" radius={4}>
      {menuItem}
    </Card>
  ) : (
    menuItem
  )
}

function StudioRegistration() {
  const {t} = useTranslation()
  const {userApplication} = useLiveUserApplication()
  const sanityWebsiteUrl = useEnvAwareSanityWebsiteUrl()
  const workspaces = useWorkspaces()
  const projectId = workspaces[0]?.projectId
  const canDeployStudio = useCanDeployStudio(!userApplication && !isDev)

  const handleRegisterStudio = useCallback(() => {
    if (!projectId || !canDeployStudio) return
    const url = new URL(`${sanityWebsiteUrl}/manage/project/${projectId}/studios`)
    url.searchParams.set('studio', 'add')
    url.searchParams.set('origin', window.location.origin)
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [projectId, sanityWebsiteUrl, canDeployStudio])

  if (userApplication || isDev) {
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
