import {Box, Flex, Popover, PopoverProps, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {Button} from '../../../../../ui'

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
              Collaborate in One Place
            </Text>

            <Text size={1}>
              Add a comment on any field. All comments for this document will be here, grouped by
              field.
            </Text>

            <Flex justify="flex-end" marginTop={2}>
              <Button size="small" text="Got it" tone="primary" onClick={onDismiss} />
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
