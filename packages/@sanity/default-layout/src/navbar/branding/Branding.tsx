// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {createElement} from 'react'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import styled from 'styled-components'
import {Text, Box} from '@sanity/ui'

const Root = styled(Box)`
  color: inherit;
  position: relative;
  text-decoration: none;
`

const ProjectNameText = styled(Text)`
  display: block;
  white-space: nowrap;
`

const LogoContainer = styled(Box)`
  color: inherit;
  cursor: pointer;
  display: block;

  svg {
    display: block;
    fill: currentColor;
    height: 1em;
    width: auto;
  }
`

interface Props {
  logo?: React.ComponentType
  projectName: string
}

function Branding(props: Props) {
  const projectName = props.projectName || 'Sanity'
  const logo = props.logo || BrandLogo

  return (
    <Root>
      {logo && <LogoContainer>{createElement(logo)}</LogoContainer>}

      {!logo && (
        <ProjectNameText align="center" forwardedAs="h1" textOverflow="ellipsis" weight="bold">
          {projectName}
        </ProjectNameText>
      )}
    </Root>
  )
}

export default Branding
