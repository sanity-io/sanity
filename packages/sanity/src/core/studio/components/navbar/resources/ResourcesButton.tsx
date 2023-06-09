import React, {useCallback, useState} from 'react'
import {HelpCircleIcon} from '@sanity/icons'
import {
  Button,
  Card,
  Text,
  Label,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Flex,
  Spinner,
  Box,
} from '@sanity/ui'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {SANITY_VERSION} from '../../../../version'
import {useGetHelpResources} from './helper-functions/hooks'
import {SectionItem} from './helper-functions/types'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

const fallbackLinks = (
  <>
    <MenuDivider />
    <MenuItem
      as="a"
      key={'fallback-link-slack'}
      text={'Join our Slack community'}
      size={0}
      href={'https://slack.sanity.io/'}
      target="_blank"
      muted={false}
    />
    <MenuItem
      as="a"
      key={'fallback-link-help-support'}
      text={'Help & Support'}
      size={0}
      href={'https://www.sanity.io/contact/support'}
      target="_blank"
      muted={false}
    />
    <MenuItem
      as="a"
      key={'fallback-link-contact-sales'}
      text={'Contact Sales'}
      size={0}
      href={'https://www.sanity.io/contact/sales?ref=studio'}
      target="_blank"
      muted={false}
    />
  </>
)

export function ResourcesButton() {
  const {scheme} = useColorScheme()

  const [open, setOpen] = useState<boolean>(false)

  const handleOpen = useCallback(() => setOpen(!open), [open])
  const {value, error, isLoading} = useGetHelpResources()

  const modalTitle = value?.resources?.title
  const sections = value?.resources?.sectionArray
  const latestStudioVersion = value?.latestVersion

  return (
    <>
      <MenuButton
        button={<Button icon={HelpCircleIcon} onClick={handleOpen} mode="bleed" fontSize={2} />}
        id="menu-button-resources"
        menu={
          <StyledMenu>
            <Card paddingY={3} paddingLeft={3}>
              <Text weight="medium" size={2} textOverflow="ellipsis">
                {modalTitle || 'Resources & Updates'}
              </Text>
            </Card>
            {/*Spinner when response is loading */}
            {isLoading && (
              <Flex align="center" justify="center" padding={3}>
                <Spinner />
              </Flex>
            )}
            {!isLoading &&
              sections?.map((subSection) => {
                if (!subSection) return null
                return <SubSections key={subSection._key} subSection={subSection} />
              })}
            {/* Fallback values if no response */}
            {!isLoading && (value === undefined || error) && fallbackLinks}
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
          </StyledMenu>
        }
        popoverScheme={scheme}
        placement="bottom"
        popover={{portal: true}}
      />
    </>
  )
}

function SubSections({subSection}: {subSection: SectionItem}) {
  return (
    <>
      {subSection.sectionTitle && (
        <Card padding={2} marginLeft={1}>
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
              item.type === 'welcome-modal' && (
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
