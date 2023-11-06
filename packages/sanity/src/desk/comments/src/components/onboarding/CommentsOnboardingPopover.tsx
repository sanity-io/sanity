import {Box, Button, Flex, Popover, PopoverProps, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled, {keyframes} from 'styled-components'

const Root = styled(Box)`
  max-width: 280px;
`

const fadeInKeyFrame = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const StyledPopover = styled(Popover)`
  opacity: 0;
  // Fade in the popover after 500ms
  animation: ${fadeInKeyFrame} 200ms 500ms forwards;
`

interface CommentsOnboardingPopoverProps extends Omit<PopoverProps, 'content'> {
  //   ...
  onDismiss: () => void
}

export function CommentsOnboardingPopover(props: CommentsOnboardingPopoverProps) {
  const {onDismiss} = props

  return (
    <StyledPopover
      content={
        <Root padding={4}>
          <Stack space={3}>
            <Text weight="semibold" size={1}>
              Collaborate in One Place
            </Text>

            <Text size={1}>
              Add a comment on any field. All comments for this document will be here, grouped by
              field.
            </Text>

            <Flex justify="flex-end" marginTop={2}>
              <Button fontSize={1} padding={2} text="Got it" tone="primary" onClick={onDismiss} />
            </Flex>
          </Stack>
        </Root>
      }
      open
      portal
      {...props}
    />
  )
}
