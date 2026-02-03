/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {LaunchIcon} from '@sanity/icons'
import {Box, Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components'
import {isProd} from '../../environment'

interface CorsOriginErrorScreenProps {
  projectId?: string
  isStaging: boolean
  /**
   * The project ID of the first workspace in the Studio config.
   * Used to show the "Register Studio" option when it matches the CORS error's project ID.
   */
  primaryProjectId?: string
}

const CenteredContainer = styled(Flex)`
  min-height: 100vh;
  box-sizing: border-box;
`

const ContentWrapper = styled(Box)`
  width: 100%;
  max-width: 640px;
`

const HelpLink = styled.a`
  color: var(--card-link-fg-color);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25em;

  &:hover {
    text-decoration: underline;
  }
`

export function CorsOriginErrorScreen(props: CorsOriginErrorScreenProps) {
  const {projectId, isStaging, primaryProjectId} = props

  // Show register option if the first workspace's projectId matches the CORS error's projectId
  const showRegisterOption = Boolean(
    primaryProjectId && projectId && primaryProjectId === projectId,
  )

  const origin = window.location.origin
  const manageBaseUrl = isStaging ? 'https://sanity.work' : 'https://sanity.io'

  const corsUrl = useMemo(() => {
    const url = new URL(`/manage/project/${projectId}/api`, manageBaseUrl)
    url.searchParams.set('cors', 'add')
    url.searchParams.set('origin', origin)
    url.searchParams.set('credentials', '')

    return url.toString()
  }, [manageBaseUrl, origin, projectId])

  const registerUrl = useMemo(() => {
    const url = new URL(`/manage/project/${projectId}/studios`, manageBaseUrl)
    url.searchParams.set('studio', 'add')
    url.searchParams.set('origin', origin)
    return url.toString()
  }, [manageBaseUrl, origin, projectId])

  useEffect(() => {
    const handleFocus = () => {
      window.location.reload()
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <Card height="fill">
      <CenteredContainer align="center" justify="center" padding={4}>
        <ContentWrapper paddingBottom={5}>
          <Stack space={5}>
            <Heading as="h1" size={2}>
              Connect this studio to your project
            </Heading>

            <Text size={2} muted>
              This studio is not registered and cannot access your content yet. Choose how you want
              to connect it.
            </Text>

            <Grid columns={showRegisterOption ? [1, 1, 2] : 1} gapX={4} gapY={3}>
              {/* Register Studio Option */}
              {showRegisterOption && (
                <Card border padding={4} radius={4}>
                  <Flex direction="column" gap={4} height="fill">
                    <Stack space={4} flex={1}>
                      <Text size={2} weight="medium">
                        Register studio
                      </Text>
                      <Text size={1} muted>
                        For production and editor-facing studios. Enables schema syncing, Content
                        Agent, and other COS features.
                      </Text>
                    </Stack>
                    <Button
                      as="a"
                      href={registerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="large"
                      text="Register this studio"
                      width="fill"
                    />
                  </Flex>
                </Card>
              )}

              {/* Add Development Host Option */}
              <Card border padding={4} radius={4}>
                <Flex direction="column" gap={4} height="fill">
                  <Stack space={4} flex={1}>
                    <Text size={2} weight="medium">
                      Add development host
                    </Text>

                    <Text size={1} muted>
                      For localhost and preview URLs. Does not register this Studio and does not
                      sync schemas.
                    </Text>
                  </Stack>

                  <Button
                    as="a"
                    href={corsUrl}
                    iconRight={LaunchIcon}
                    target="_blank"
                    rel="noopener noreferrer"
                    text="Add development host"
                    mode="ghost"
                    size="large"
                    width="fill"
                  />
                </Flex>
              </Card>

              {showRegisterOption && isProd && (
                <Flex justify="center">
                  <Text size={1} muted>
                    Recommended
                  </Text>
                </Flex>
              )}
            </Grid>

            <Flex justify="flex-end">
              <Text size={1}>
                <HelpLink
                  href="https://www.sanity.io/docs/cors"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{textDecoration: 'none'}}
                >
                  Need help? &rarr;
                </HelpLink>
              </Text>
            </Flex>
          </Stack>
        </ContentWrapper>
      </CenteredContainer>
    </Card>
  )
}
