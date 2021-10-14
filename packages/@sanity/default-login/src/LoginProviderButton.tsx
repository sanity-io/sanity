import {Box, Button, Flex, Inline, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled, {css} from 'styled-components'
import {getProviderLogo} from './util/getProviderLogo'

const Root = styled(Button)(({theme}) => {
  const {bleed, ghost} = theme.sanity.color.button

  return css`
    @media (hover: hover) {
      &:not([data-disabled='true']):hover {
        --card-bg-color: ${bleed.default.hovered.bg};
        --card-fg-color: ${bleed.default.hovered.fg};
        --card-border-color: ${ghost.default.enabled.border};
      }
    }
  `
})

const ProviderLogoWrapper = styled(Box)`
  svg,
  img {
    border-radius: 50%;
    height: 1.25em;
    width: 1.25em;
  }
`

export function LoginProviderButton({onLogin, provider}: any) {
  const ProviderLogo = getProviderLogo(provider)

  const handleClick = useCallback(
    (event) => {
      onLogin(provider, event)
    },
    [onLogin, provider]
  )

  return (
    <Root mode="ghost" paddingY={3} onClick={handleClick}>
      <Flex justify="center">
        <Inline space={2}>
          <ProviderLogoWrapper>
            <ProviderLogo />
          </ProviderLogoWrapper>
          <Box>
            <Text>{provider?.title}</Text>
          </Box>
        </Inline>
      </Flex>
    </Root>
  )
}
