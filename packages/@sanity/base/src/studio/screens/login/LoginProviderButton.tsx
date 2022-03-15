import {Button} from '@sanity/ui'
import React, {createElement, useCallback} from 'react'
import styled, {css} from 'styled-components'
import {SanityAuthProvider} from '../../../auth'
import {providerLogos} from './providerLogos'

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

export function LoginProviderButton(props: {projectId: string; provider: SanityAuthProvider}) {
  const {projectId, provider} = props
  const logoComponent = providerLogos[provider.name]

  const handleClick = useCallback(() => {
    const currentUrl = encodeURIComponent(window.location.toString())
    const params = [`origin=${currentUrl}`, projectId && `projectId=${projectId}`].filter(Boolean)

    window.location.href = `${provider.url}?${params.join('&')}`
  }, [projectId, provider])

  return (
    <Root
      icon={logoComponent && createElement(logoComponent, {provider})}
      mode="ghost"
      paddingY={3}
      onClick={handleClick}
      // @todo: this text should be updated in the backend
      text={provider.title.replace('E-mail /', 'Email &')}
    />
  )
}
