import {DotIcon} from '@sanity/icons'
import {MenuDivider, Text} from '@sanity/ui'
import semver from 'semver'

import {MenuItem} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {useTranslation} from '../../../../i18n'
import {SANITY_VERSION} from '../../../../version'
import {StudioAnnouncementsMenuItem} from '../../../studioAnnouncements/StudioAnnouncementsMenuItem'
import {type ResourcesResponse, type Section} from './helper-functions/types'

interface ResourcesMenuItemProps {
  error: Error | null
  isLoading: boolean
  newAutoUpdateVersion?: string
  value?: ResourcesResponse
  onOpenStudioVersionDialog: () => void
}

const UpdateDot = () => (
  <Text size={2}>
    <DotIcon style={{color: `var(--card-badge-primary-dot-color)`}} />
  </Text>
)

function reload() {
  document.location.reload()
}

export function ResourcesMenuItems({
  error,
  isLoading,
  value,
  onOpenStudioVersionDialog,
  newAutoUpdateVersion,
}: ResourcesMenuItemProps) {
  const sections = value?.resources?.sectionArray
  const {t} = useTranslation()
  if (isLoading) {
    return <LoadingBlock showText />
  }
  const latestVersion = value?.latestVersion

  const isOutdated = latestVersion
    ? (semver.parse(SANITY_VERSION)?.compareMain?.(latestVersion) ?? 0) < 0
    : false
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
      <MenuDivider />
    </>
  )

  return (
    <>
      {/* Display fallback values on error / no response */}
      {(value === undefined || error) && <div>{fallbackLinks}</div>}

      {!error &&
        sections?.map((subSection) => {
          if (!subSection) return null
          return <SubSection key={subSection._key} subSection={subSection} />
        })}

      {/* Studio version information */}
      <MenuItem
        onClick={onOpenStudioVersionDialog}
        text={t('help-resources.studio-version', {
          studioVersion: semver.parse(SANITY_VERSION)?.version || SANITY_VERSION,
        })}
      />
      {newAutoUpdateVersion ? (
        <MenuItem
          tone="primary"
          onClick={reload}
          data-testid="menu-item-update-studio-now"
          text={t('help-resources.studio-auto-update-now', {
            newVersion: newAutoUpdateVersion,
          })}
          iconRight={UpdateDot}
        />
      ) : isOutdated ? (
        <MenuItem
          tone="primary"
          onClick={onOpenStudioVersionDialog}
          text={t('help-resources.latest-sanity-version', {
            latestVersion,
          })}
          iconRight={UpdateDot}
        />
      ) : null}
    </>
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
      <MenuDivider />
    </>
  )
}
