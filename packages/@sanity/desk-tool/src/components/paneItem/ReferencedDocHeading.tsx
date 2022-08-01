import React, {ReactNode, useRef} from 'react'
import {Popover, Box, Text, Heading, Flex, Button, Stack, ThemeColorProvider} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'
import {TitleText, LinkCircle, HorizontalLine, StyledBox} from '../pane/PaneHeader.styles'
import {useDeskToolSetting} from '../../settings'
import {ReferencedDocTooltip} from './ReferencedDocTooltip'

export function ReferencedDocHeading({title}: {title?: ReactNode}) {
  const referenceTitle = useRef(null)
  const [hidePopover, setHidePopover] = useDeskToolSetting(
    'desk-tool',
    'referenced-doc-has-confirmed-dialog',
    false
  )

  if (hidePopover) {
    return (
      <Flex>
        <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
          {title}
        </TitleText>
        <ReferencedDocTooltip />
      </Flex>
    )
  }

  const onClose = () => {
    setHidePopover(true)
  }

  return (
    <ThemeColorProvider tone="default">
      <Box marginLeft={2}>
        <Popover
          content={<InnerPopover onClose={onClose} />}
          placement="bottom-start"
          referenceElement={referenceTitle.current}
          portal
          open
        >
          <Box display="flex">
            {/* This empty div is added to prevent a jump of the popover pointer once the title is rendered */}
            <div ref={referenceTitle}>{''}</div>
            <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
              <Box marginBottom={2}>{title}</Box>
            </TitleText>
            <ReferencedDocTooltip />
          </Box>
        </Popover>
      </Box>
    </ThemeColorProvider>
  )
}

function InnerPopover({onClose}: {onClose?: () => void}) {
  return (
    <StyledBox as="div">
      <Box margin={4}>
        <Flex marginBottom={4} align="center">
          <Box marginRight={2}>
            <LinkCircle>
              <LinkIcon fontSize={'24'} />
            </LinkCircle>
          </Box>
          <Heading size={1}>This is a referenced document</Heading>
        </Flex>
        <Text>Changes to this type of document may affect other documents that reference it</Text>
      </Box>
      <HorizontalLine />
      <Box padding={3}>
        <Stack space={2}>
          <Button onClick={onClose} tone="primary" text="Got it" />
        </Stack>
      </Box>
    </StyledBox>
  )
}
