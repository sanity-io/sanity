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
} from '@sanity/ui'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {useGetHelpResources} from './helper-functions/hooks'
import {SectionItem} from './helper-functions/types'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const fallbackComponent = (
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

  return (
    <>
      <MenuButton
        button={<Button icon={HelpCircleIcon} onClick={handleOpen} mode="bleed" fontSize={2} />}
        id="menu-button-resources"
        menu={
          <StyledMenu>
            <Card paddingY={3} paddingX={2}>
              <Text weight="medium" size={2}>
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
            {!isLoading && (value === undefined || error) && fallbackComponent}
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
      <MenuDivider />
      {subSection.sectionTitle && (
        <Card padding={2}>
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
    </>
  )
}
