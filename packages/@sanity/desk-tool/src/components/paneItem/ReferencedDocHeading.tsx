import React, {ReactNode} from 'react'
import {
  Card,
  Popover,
  Box,
  Text,
  Heading,
  Flex,
  Button,
  Stack,
  ThemeColorProvider,
} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'
import {TitleText, LinkCircle} from '../pane/PaneHeader.styles'
import {useDeskToolSetting} from '../../settings'
import {ReferencedDocTooltip} from './ReferencedDocTooltip'

export function ReferencedDocHeading({title}: {title?: ReactNode}) {
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
      <Box marginLeft={2} marginTop={2}>
        <Popover
          content={<InnerPopover onClose={onClose} />}
          placement="bottom-start"
          referenceElement={document.getElementById('referenceTitle')}
          portal
          open
        >
          <Box display="flex">
            <TitleText id="referenceTitle" tabIndex={0} textOverflow="ellipsis" weight="semibold">
              {title}
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
    <Box as={'div'} style={{maxWidth: 352}}>
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
      <Card as="li" padding={3} radius={2} shadow={1} tone="inherit">
        <Stack space={2}>
          <Button onClick={onClose} tone="primary" text="Got it" />
        </Stack>
      </Card>
    </Box>
  )
}
