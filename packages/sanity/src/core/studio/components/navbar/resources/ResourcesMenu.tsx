import React from 'react'
import {Card, Text, Label, Menu, MenuDivider, MenuItem, Flex, Spinner, Box} from '@sanity/ui'
import styled from 'styled-components'
import {SANITY_VERSION} from '../../../../version'
import {ResourcesResponse, Section} from './helper-functions/types'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export const FallbackLinks = () => (
  <>
    <MenuItem
      as="a"
      text="Join our community"
      size={0}
      href="https://www.sanity.io/exchange/community"
      target="_blank"
      muted={false}
    />
    <MenuItem
      as="a"
      text="Help and support"
      size={0}
      href="https://www.sanity.io/contact/support"
      target="_blank"
      muted={false}
    />
    <MenuItem
      as="a"
      text="Contact sales"
      size={0}
      href="https://www.sanity.io/contact/sales?ref=studio"
      target="_blank"
      muted={false}
    />
    <MenuDivider />
  </>
)

interface ResourcesMenuProps {
  value: ResourcesResponse | undefined
  error: Error | null
  isLoading: boolean
}

export function ResourcesMenu(props: ResourcesMenuProps) {
  const {value, error, isLoading} = props
  const sections = value?.resources?.sectionArray
  const latestStudioVersion = value?.latestVersion

  return (
    <StyledMenu>
      {isLoading ? (
        <Flex align="center" justify="center" padding={3}>
          <Spinner />
        </Flex>
      ) : (
        <>
          {/* Display fallback values on error / no response */}
          {(value === undefined || error) && <FallbackLinks />}

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
            {!error && !isLoading && latestStudioVersion && (
              <Box paddingTop={2}>
                <Text size={1} muted textOverflow="ellipsis">
                  Latest version is {latestStudioVersion}
                </Text>
              </Box>
            )}
          </Box>
        </>
      )}
    </StyledMenu>
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
