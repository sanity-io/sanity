import {Box, Card, Flex, Label, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import React from 'react'
import {SANITY_VERSION} from '../../../../version'
import {useTranslation} from '../../../../i18n'
import {ResourcesResponse, Section} from './helper-functions/types'

interface ResourcesMenuItemProps {
  error: Error | null
  isLoading: boolean
  value?: ResourcesResponse
}

export function ResourcesMenuItems({error, isLoading, value}: ResourcesMenuItemProps) {
  const sections = value?.resources?.sectionArray
  const latestStudioVersion = value?.latestVersion
  const {t} = useTranslation()

  if (isLoading) {
    return (
      <Flex align="center" justify="center" padding={3}>
        <Spinner />
      </Flex>
    )
  }

  const fallbackLinks = (
    <>
      <MenuItem
        as="a"
        text={t('helpResources.action.join-our-community')}
        size={0}
        href="https://www.sanity.io/exchange/community"
        target="_blank"
        muted={false}
      />
      <MenuItem
        as="a"
        text={t('helpResources.action.help-and-support')}
        size={0}
        href="https://www.sanity.io/contact/support"
        target="_blank"
        muted={false}
      />
      <MenuItem
        as="a"
        text={t('helpResources.action.contact-sales')}
        size={0}
        href="https://www.sanity.io/contact/sales?ref=studio"
        target="_blank"
        muted={false}
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
      <Box padding={3}>
        <Text size={1} muted weight="medium" textOverflow="ellipsis">
          {t('helpResources.studio-version', {studioVersion: SANITY_VERSION})}
        </Text>
        {!error && latestStudioVersion && (
          <Box paddingTop={2}>
            <Text size={1} muted textOverflow="ellipsis">
              {t('helpResources.latest-sanity-version', {
                latestVersion: latestStudioVersion,
              })}
            </Text>
          </Box>
        )}
      </Box>
    </>
  )
}

function SubSection({subSection}: {subSection: Section}) {
  return (
    <>
      {subSection.sectionTitle && (
        <Card padding={2} paddingTop={3} marginLeft={1}>
          <Label muted size={1}>
            {subSection.sectionTitle}
          </Label>
        </Card>
      )}
      {subSection?.items?.map((item) => {
        if (!item || !item.title) return null
        switch (item._type) {
          case 'externalLink':
            if (!item.url) return null
            return (
              <MenuItem
                as="a"
                tone="default"
                key={item._key}
                text={item.title}
                size={0}
                href={item.url}
                target="_blank"
              />
            )
          case 'internalAction': // TODO: Add support for internal actions (MVI-2)
            if (!item.type) return null
            return (
              item.type === 'show-welcome-modal' && (
                <MenuItem key={item._key} text={item.title} size={0} />
              )
            )

          default:
            return null
        }
      })}
      <MenuDivider />
    </>
  )
}
