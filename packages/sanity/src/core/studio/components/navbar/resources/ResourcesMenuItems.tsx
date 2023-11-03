import {Box, Card, Flex, Label, MenuDivider, Spinner, Text} from '@sanity/ui'
import React from 'react'
import {SANITY_VERSION} from '../../../../version'
import {MenuItem} from '../../../../../ui'
import {ResourcesResponse, Section} from './helper-functions/types'

interface ResourcesMenuItemProps {
  error: Error | null
  isLoading: boolean
  value?: ResourcesResponse
}

export function ResourcesMenuItems({error, isLoading, value}: ResourcesMenuItemProps) {
  const sections = value?.resources?.sectionArray
  const latestStudioVersion = value?.latestVersion

  if (isLoading) {
    return (
      <Flex align="center" justify="center" padding={3}>
        <Spinner />
      </Flex>
    )
  }

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
          Sanity Studio version {SANITY_VERSION}
        </Text>
        {!error && latestStudioVersion && (
          <Box paddingTop={2}>
            <Text size={1} muted textOverflow="ellipsis">
              Latest version is {latestStudioVersion}
            </Text>
          </Box>
        )}
      </Box>
    </>
  )
}

const fallbackLinks = (
  <>
    <MenuItem
      as="a"
      text="Join our community"
      href="https://www.sanity.io/exchange/community"
      target="_blank"
    />
    <MenuItem
      as="a"
      text="Help and support"
      href="https://www.sanity.io/contact/support"
      target="_blank"
    />
    <MenuItem
      as="a"
      text="Contact sales"
      href="https://www.sanity.io/contact/sales?ref=studio"
      target="_blank"
    />
    <MenuDivider />
  </>
)

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
                href={item.url}
                target="_blank"
              />
            )
          case 'internalAction': // TODO: Add support for internal actions (MVI-2)
            if (!item.type) return null
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
