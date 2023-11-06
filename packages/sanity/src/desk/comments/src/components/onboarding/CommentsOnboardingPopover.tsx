import {Box, Button, Flex, Popover, PopoverProps, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const Root = styled(Box)`
  max-width: 280px;
`

interface CommentsOnboardingPopoverProps extends Omit<PopoverProps, 'content'> {
  //   ...
  onDismiss: () => void
}

export function CommentsOnboardingPopover(props: CommentsOnboardingPopoverProps) {
  const {onDismiss} = props

  return (
    <Popover
      content={
        <Root padding={4}>
          <Stack space={3}>
            <Text weight="semibold" size={1}>
              Document fields now have comments
            </Text>

            <Text size={1}>
              You can add comments to any field in a document. They'll show up here, grouped by
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
