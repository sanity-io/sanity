import {
  Box,
  MenuDivider,
  // eslint-disable-next-line no-restricted-imports
  MenuItem as UIMenuItem,
  Stack,
  Text,
} from '@sanity/ui'

import {MenuItem} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {hasSanityPackageInImportMap} from '../../../../environment/hasSanityPackageInImportMap'
import {useTranslation} from '../../../../i18n'
import {SANITY_VERSION} from '../../../../version'
import {StudioAnnouncementsMenuItem} from '../../../studioAnnouncements/StudioAnnouncementsMenuItem'
import {type ResourcesResponse, type Section} from './helper-functions/types'

interface ResourcesMenuItemProps {
  error: Error | null
  isLoading: boolean
  value?: ResourcesResponse
  onAboutDialogOpen: () => void
}

export function ResourcesMenuItems({
  error,
  isLoading,
  value,
  onAboutDialogOpen,
}: ResourcesMenuItemProps) {
  const sections = value?.resources?.sectionArray
  const latestVersion = value?.latestVersion
  const isAutoUpdating = hasSanityPackageInImportMap()
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
      <UIMenuItem onClick={onAboutDialogOpen}>
        <Stack space={1}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {t('help-resources.studio-version', {studioVersion: SANITY_VERSION})}
          </Text>
          {!error && latestVersion && !isAutoUpdating && (
            <Box paddingTop={2}>
              <Text size={1} textOverflow="ellipsis">
                {t('help-resources.latest-sanity-version', {
                  latestVersion,
                })}
              </Text>
            </Box>
          )}
        </Stack>
      </UIMenuItem>
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
