import {CloseIcon} from '@sanity/icons'
import {Box, Card, CardProps, Flex, Text} from '@sanity/ui'
import React, {HTMLProps, ReactNode} from 'react'
import styled from 'styled-components'
import {Button} from '../../../../ui'

export interface DocumentInspectorHeaderProps {
  as?: CardProps['as']
  closeButtonLabel: string
  flex?: CardProps['flex']
  onClose: () => void
  title: ReactNode
}

const Root = styled(Card)({
  position: 'relative',
  zIndex: 1,
  lineHeight: 0,

  '&:after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    bottom: -1,
    right: 0,
    borderBottom: '1px solid var(--card-border-color)',
    opacity: 0.5,
  },
})

/** @internal */
export function DocumentInspectorHeader(
  props: DocumentInspectorHeaderProps & Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
) {
  const {as: forwardedAs, children, closeButtonLabel, onClose, title, ...restProps} = props

  return (
    <Root {...restProps} as={forwardedAs}>
      <Flex padding={2}>
        <Box flex={1} padding={3}>
          <Text as="h1" size={1} weight="medium">
            {title}
          </Text>
        </Box>
        <Box flex="none" padding={1}>
          <Button
            aria-label={closeButtonLabel}
            icon={CloseIcon}
            mode="bleed"
            onClick={onClose}
            size="small"
            tooltipProps={{content: 'Close'}}
          />
        </Box>
      </Flex>
      {children}
    </Root>
  )
}
