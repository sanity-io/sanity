import {Box, Flex, Heading, Stack, Text} from '@sanity/ui'
import config from 'config:sanity'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {BrandLogo} from './legacyParts'
import {LoginProviderButton} from './LoginProviderButton'

const BrandLogoWrapper = styled(Flex)`
  svg {
    display: block;
    height: 2rem;
    width: auto;
    margin: 0 auto;
  }
`

const projectName = (config.project && config.project.name) || ''

export default class LoginDialogContent extends React.PureComponent {
  static propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    // eslint-disable-next-line react/forbid-prop-types
    providers: PropTypes.array,
    onLoginButtonClick: PropTypes.func,
    SanityLogo: PropTypes.oneOfType([PropTypes.object, PropTypes.node, PropTypes.func]),
  }

  static defaultProps = {
    description: null,
    providers: null,
    onLoginButtonClick: null,
    SanityLogo: null,
  }

  handleLoginButtonClicked = (provider, event) => {
    const {onLoginButtonClick} = this.props

    if (onLoginButtonClick) {
      this.props.onLoginButtonClick(provider, event)
    } else {
      console.warn('LoginDialogContent is missing the onLoginButtonClick property') // eslint-disable-line no-console
    }
  }

  render() {
    const {title, description, providers = [], SanityLogo} = this.props

    return (
      <Box paddingX={4} paddingY={5}>
        <Stack space={4}>
          {BrandLogo && projectName && (
            <BrandLogoWrapper justify="center">
              <BrandLogo projectName={projectName} />
            </BrandLogoWrapper>
          )}
          <Stack space={4}>
            {!BrandLogo && projectName && (
              <Heading align="center" as="h1">
                {projectName}
              </Heading>
            )}
            {title && (
              <Text align="center" size={1} weight="semibold">
                {title}
              </Text>
            )}
            {description && (
              <Text align="center" muted size={1}>
                {description}
              </Text>
            )}
          </Stack>

          <Stack space={2} as="ul">
            {providers.map((provider, providerIndex) => (
              <LoginProviderButton
                key={provider?.name || providerIndex}
                onLogin={this.handleLoginButtonClicked}
                provider={provider}
              />
            ))}
          </Stack>

          {SanityLogo && (
            <Flex justify="center" marginTop={2}>
              <Text>
                <SanityLogo />
              </Text>
            </Flex>
          )}
        </Stack>
      </Box>
    )
  }
}
