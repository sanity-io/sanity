import React, {useState} from 'react'
import {Card, Popover, Box, Text, Heading, Flex, Button, Stack} from '@sanity/ui'
import {AddIcon, CheckmarkIcon, CloseIcon, LinkIcon, RemoveIcon} from '@sanity/icons'
import styled from 'styled-components'
import {LinkIconBackground} from '../pane/PaneHeader.styles'

//Spør: Hvordan jeg skal gjøre det med popover.
//Ha to stk, eller en med flere props?
//Hvordan gjøre det med knappen som popover skal "følge"
//Hvorfor følger ikke popover ikonet nå?

export function ReferencedDocPopover({popoverElement}: {popoverElement: JSX.Element}) {
  const [hidePopover, setShowPopover] = useState(
    window.localStorage.getItem('showReferenceInfo_closedPopover') !== null
  )

  if (hidePopover) {
    return null
  }

  const onClose = () => {
    window.localStorage.setItem('showReferenceInfo_closedPopover', 'true')
    setShowPopover(true)
  }

  const text = 'Changes to this type of document may affect other documents that reference it'

  return (
    <Card marginLeft={2}>
      <Popover
        content={<InnerPopover onClose={onClose} text={text} />}
        placement="bottom"
        portal
        open
      >
        <Text size={2}>{popoverElement}</Text>
      </Popover>
    </Card>
  )
}

interface Props {
  onClose?: () => void
  text: string
}

function InnerPopover(props: Props) {
  const {onClose, text} = props
  return (
    //Spør: MaxWidth her
    <Card as={'div'} style={{maxWidth: 352}}>
      <Box padding={4}>
        <Flex marginBottom={4} align="center">
          <Card marginRight={2}>
            <LinkBox>
              <LinkIcon fontSize={'24'} />
            </LinkBox>
          </Card>
          <Heading size={1}>This is a referenced document</Heading>
        </Flex>
        <Text>{text}</Text>
      </Box>
      <Card as="li" padding={3} radius={2} shadow={1} tone="inherit">
        <Stack space={2}>
          <Button onClick={onClose} tone="primary" text="Got it" />
        </Stack>
      </Card>
    </Card>
  )
}

const LinkBox = styled.div`
  border-color: #e8f1fe;
  border: 1px solid grey;
  border-radius: 50%;
  width: 25px;
  height: 25px;
`

export function EditReferencePublishPopover() {
  const text = 'Publishing changes may affect documents that reference this document'
  return (
    <Card marginLeft={2}>
      <Popover content={<InnerPopoverPublishAction text={text} />} placement="bottom" portal open>
        <Text size={2}>hei</Text>
      </Popover>
    </Card>
  )
}

function InnerPopoverPublishAction(props: Props) {
  const {onClose, text} = props
  return (
    //Spør: MaxWidth her
    <Card as={'div'} style={{maxWidth: 250}}>
      <Box padding={4}>
        <Flex marginBottom={4} align="center">
          <Card marginRight={2}>
            <LinkBox>
              <LinkIcon fontSize={'24'} />
            </LinkBox>
          </Card>
          <Heading size={1}>Referenced Document</Heading>
        </Flex>
        <Text>{text}</Text>
      </Box>
      <Card as="li" padding={3} radius={2} shadow={1} tone="inherit">
        <Flex justify={'space-evenly'}>
          <Button icon={CloseIcon} onClick={onClose} mode="ghost" text="Cancel" />
          <Button icon={CheckmarkIcon} onClick={onClose} tone="positive" text="Confirm" />
        </Flex>
      </Card>
    </Card>
  )
}
