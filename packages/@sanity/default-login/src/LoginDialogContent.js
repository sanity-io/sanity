/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import config from 'config:sanity'
import {Button, Stack, Heading, Inline, Flex, Text, Box, Card} from '@sanity/ui'
import styled from 'styled-components'
import {BrandLogo} from './legacyParts'
import {getProviderLogo} from './util/getProviderLogo'

const ProviderLogoWrapper = styled(Box)`
  svg,
  img {
    border-radius: 50%;
    height: 1.25em;
    width: 1.25em;
  }
`

const BrandLogoWrapper = styled(Box)`
  svg {
    display: block;
    height: 2rem;
    width: auto;
    margin: 0 auto;
  }
`

const projectName = (config.project && config.project.name) || ''

// eslint-disable-next-line react/require-optimization
export default class LoginDialogContent extends React.Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    // eslint-disable-next-line react/forbid-prop-types
    providers: PropTypes.array,
    onLoginButtonClick: PropTypes.func,
    SanityLogo: PropTypes.func,
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
    const {title, description, providers, SanityLogo} = this.props
    return (
      <Box paddingX={4} paddingY={5}>
        <Stack space={5}>
          {BrandLogo && projectName && (
            <BrandLogoWrapper>
              <BrandLogo projectName={projectName} />
            </BrandLogoWrapper>
          )}
          <Stack space={4}>
            {!BrandLogo && projectName && (
              <Heading align="center" as="h2" size={3}>
                {projectName}
              </Heading>
            )}
            {title && (
              <Text align="center" weight="semibold">
                {title}
              </Text>
            )}
            {description && (
              <Text size={1} muted align="center">
                {description}
              </Text>
            )}
          </Stack>

          <Stack space={2} as="ul">
            {providers?.map((provider) => {
              const ProviderLogo = getProviderLogo(provider)
              const onLoginClick = this.handleLoginButtonClicked.bind(this, provider)
              return (
                <Card key={provider?.name} radius={2} border as="li">
                  <Button mode="bleed" paddingY={4} onClick={onLoginClick} style={{width: '100%'}}>
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
                  </Button>
                </Card>
              )
            })}
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
