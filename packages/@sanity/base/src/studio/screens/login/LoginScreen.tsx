import {SanityLogo} from '@sanity/logos'
import {Box, Breadcrumbs, Card, Container, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {first} from 'rxjs/operators'
import {startCase} from 'lodash'
import {useColorScheme} from '../../colorScheme'
import {AuthController, SanityAuthProvider} from '../../../auth'
import {SourceOptions} from '../../../config'
import {LoginProviderButton} from './LoginProviderButton'
// import {useAuth} from '../../../auth'
// import {LoginProviderButton} from './LoginProviderButton'

const Root = styled(Card)`
  &:not([hidden]) {
    display: flex;
  }

  min-height: 100%;
  flex-direction: column;
`

interface LoginScreenProps {
  // TODO: these props are likely to change. currently these props are populated
  // when an error is caught in an error boundary that causes this screen to
  // show as a fallback. that error only contains the source options but this
  // should be expanded to the workspace options or something more multi-source
  sourceOptions: SourceOptions
  authController: AuthController
}

export const LoginScreen = function LoginScreen({authController, sourceOptions}: LoginScreenProps) {
  const [error, setError] = useState<unknown>(null)
  const [providers, setProviders] = useState<SanityAuthProvider[]>([])
  const {scheme} = useColorScheme()
  const {projectId, title, name} = sourceOptions

  if (error) throw error

  useEffect(() => {
    const subscription = authController.getProviders().subscribe({
      next: setProviders,
      error: setError,
    })

    return () => subscription.unsubscribe()
  }, [authController])

  if (!providers.length) {
    return (
      <Root height="fill" padding={4} sizing="border">
        <Flex align="center" height="fill" justify="center">
          <Spinner muted />
        </Flex>
      </Root>
    )
  }

  return (
    <Root height="fill" padding={4} sizing="border">
      <Flex align="center" height="fill" justify="center">
        <Container width={0}>
          <Card radius={3} shadow={1}>
            <Box paddingX={4} paddingTop={5} paddingBottom={4}>
              <Heading align="center" as="h1">
                {title || startCase(name)}
              </Heading>

              <Box marginTop={3}>
                <Text align="center" as="p" muted size={1}>
                  Choose your login provider
                </Text>
              </Box>
            </Box>

            <Stack as="ul" padding={3} space={2}>
              {providers.map((provider) => (
                <Stack as="li" key={provider.name}>
                  <LoginProviderButton projectId={projectId} provider={provider} />
                </Stack>
              ))}
            </Stack>
          </Card>

          <Flex align="center" direction="column" marginTop={5}>
            <Box marginBottom={4}>
              <Text>
                <SanityLogo dark={scheme === 'dark'} />
              </Text>
            </Box>

            <Breadcrumbs
              separator={
                <Text muted size={1}>
                  &middot;
                </Text>
              }
              space={2}
            >
              <Text as="a" size={1} href="https://slack.sanity.io/">
                Community
              </Text>
              <Text as="a" size={1} href="https://www.sanity.io/docs">
                Docs
              </Text>
              <Text as="a" size={1} href="https://www.sanity.io/legal/privacy">
                Privacy
              </Text>
              <Text as="a" size={1} href="https://www.sanity.io/">
                sanity.io
              </Text>
            </Breadcrumbs>
          </Flex>
        </Container>
      </Flex>
    </Root>
  )
}
