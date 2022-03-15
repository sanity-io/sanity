import {SanityLogo} from '@sanity/logos'
import {Box, Breadcrumbs, Card, Container, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useAuth} from '../../../auth'
import {useSanity} from '../../../sanity'
import {useSource} from '../../../source'
import {useStudio} from '../../useStudio'
import {LoginProviderButton} from './LoginProviderButton'

const Root = styled(Box)`
  &:not([hidden]) {
    display: flex;
  }

  min-height: 100%;
  flex-direction: column;
`

export const LoginScreen = function LoginScreen() {
  const {project} = useSanity()
  const source = useSource()
  const {providers} = useAuth()
  const {scheme} = useStudio()

  if (!providers) {
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
                {project.name || 'Sanity Studio'}
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
                  <LoginProviderButton projectId={source.projectId} provider={provider} />
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
              <Text size={1}>Community</Text>
              <Text size={1}>Docs</Text>
              <Text size={1}>Privacy</Text>
              <Text size={1}>sanity.io</Text>
            </Breadcrumbs>
          </Flex>
        </Container>
      </Flex>
    </Root>
  )
}
