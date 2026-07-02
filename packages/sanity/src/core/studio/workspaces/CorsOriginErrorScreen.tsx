/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {LaunchIcon} from '@sanity/icons'
import {Box, Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
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
  /**
   * The origin to register / add as a CORS entry. Passed in (rather than
   * read from `window` here) so the screen stays pure — the live flow
   * passes `window.location.origin`, and the error playground can preview
   * the screen for other origins (e.g. a custom domain, which shows the
   * "Register Studio" option that a localhost dev origin does not).
   */
  origin: string
  /**
   * Mirrors `/check/cors`'s `result.allowed` — whether the origin is in
   * the project's CORS allowlist.
   */
  allowed?: boolean
  /**
   * Mirrors `/check/cors`'s `result.withCredentials` — whether the
   * allowlist entry permits credentialed requests. When `allowed: true`
   * and `withCredentials: false`, the screen shows the "re-add with
   * credentials" branch.
   */
  withCredentials?: boolean
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

// Mirror of the manage-side validation for registering a Studio host. If
// the user's origin would be rejected by the registration form, we hide
// the "Register Studio" option so they don't get sent to a page where the
// form fails silently. Keep in sync with the Manage validator.
const STUDIO_HOST_PATTERN = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/
const STUDIO_HOST_DENYLIST = ['127.0.0.1', '0.0.0.0']

function canRegisterStudioForOrigin(origin: string): boolean {
  // The registration form takes the URL the user types in, but here we
  // already have window.location.origin. Strip the protocol to match the
  // denylist (which contains bare IPs).
  const withoutProtocol = origin.replace(/^https?:\/\//, '')
  // Strip port for the denylist check too — "127.0.0.1:3333" should still
  // match the "127.0.0.1" denylist entry.
  const host = withoutProtocol.split(/[:/?#]/, 1)[0]
  if (STUDIO_HOST_DENYLIST.includes(host)) return false
  return STUDIO_HOST_PATTERN.test(origin)
}

/** @internal */
export function CorsOriginErrorScreen(props: CorsOriginErrorScreenProps) {
  const {projectId, isStaging, primaryProjectId, allowed, withCredentials, origin} = props

  // Show register option only if:
  //   1. the first workspace's projectId matches the CORS error's projectId
  //      (so we know the user actually owns this project), AND
  //   2. the current origin is registerable per the Manage validator —
  //      otherwise we'd send the user to a form they can't submit.
  const showRegisterOption =
    Boolean(primaryProjectId && projectId && primaryProjectId === projectId) &&
    canRegisterStudioForOrigin(origin)
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

  // The origin already has a CORS entry, just without credentials. CORS
  // entries can't be edited in Manage — the user has to remove the old
  // entry and re-add it with credentials enabled. The "add" deeplink
  // pre-fills the origin + credentials so it's a one-click re-add after
  // the manual delete.
  const reAddCorsUrl = useMemo(() => {
    const url = new URL(`/manage/project/${projectId}/api`, manageBaseUrl)
    url.searchParams.set('cors', 'add')
    url.searchParams.set('origin', origin)
    url.searchParams.set('credentials', '1')
    return url.toString()
  }, [manageBaseUrl, origin, projectId])

  if (allowed && !withCredentials) {
    return (
      <Card data-testid="studio-error-screen" data-error="CORS credentials disabled" height="fill">
        <CenteredContainer align="center" justify="center" padding={4}>
          <ContentWrapper paddingBottom={5}>
            <Stack space={5}>
              <Heading as="h1" size={2}>
                Enable credentials for this Studio
              </Heading>

              <Text size={2} muted>
                This origin is registered with your project, but the existing CORS entry
                doesn&apos;t allow credentialed requests. The Studio needs them for login, drafts,
                and mutations. CORS entries can&apos;t be edited, so remove the existing entry for
                this origin, then re-add it with credentials.
              </Text>

              <Flex>
                <Button
                  as="a"
                  href={reAddCorsUrl}
                  iconRight={LaunchIcon}
                  rel="noopener noreferrer"
                  size="large"
                  target="_blank"
                  text="Re-add CORS origin with credentials"
                />
              </Flex>

              <Flex justify="flex-end">
                <Text size={1}>
                  <HelpLink
                    href="https://www.sanity.io/docs/cors"
                    rel="noopener noreferrer"
                    style={{textDecoration: 'none'}}
                    target="_blank"
                  >
                    Need help with CORS? &rarr;
                  </HelpLink>
                </Text>
              </Flex>
            </Stack>
          </ContentWrapper>
        </CenteredContainer>
      </Card>
    )
  }

  return (
    <Card data-testid="studio-error-screen" data-error="CORS origin error" height="fill">
      <CenteredContainer align="center" justify="center" padding={4}>
        <ContentWrapper paddingBottom={5}>
          <Stack space={5}>
            <Heading as="h1" size={2}>
              Connect this Studio to your project
            </Heading>

            <Text size={2} muted>
              This Studio isn&apos;t connected to your project yet. Pick an option below to connect
              it.
            </Text>

            <Grid columns={showRegisterOption ? [1, 1, 2] : 1} gapX={4} gapY={3}>
              {/* Register Studio Option */}
              {showRegisterOption && (
                <Card border padding={4} radius={4}>
                  <Flex direction="column" gap={4} height="fill">
                    <Stack space={4} flex={1}>
                      <Text size={2} weight="medium">
                        Register Studio
                      </Text>
                      {isProd && (
                        <Text size={1} weight="medium">
                          Recommended for production and editor-facing deploys.
                        </Text>
                      )}
                      <Text size={1} muted>
                        Adds a CORS origin for this URL and registers the Studio so it can sync its
                        schema and manifest with the project. Required for schema-aware search,
                        Content Agent, and other features that read the deployed schema.
                      </Text>
                    </Stack>
                    <Button
                      as="a"
                      href={registerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="large"
                      text="Register Studio"
                      width="fill"
                    />
                  </Flex>
                </Card>
              )}

              {/* Add CORS origin */}
              <Card border padding={4} radius={4}>
                <Flex direction="column" gap={4} height="fill">
                  <Stack space={4} flex={1}>
                    <Text size={2} weight="medium">
                      Add CORS origin
                    </Text>

                    <Text size={1} muted>
                      For URLs that don&apos;t need schema syncing or other registered-Studio
                      features (localhost, preview deploys, and other one-off origins).
                    </Text>
                  </Stack>

                  <Button
                    as="a"
                    href={corsUrl}
                    iconRight={LaunchIcon}
                    target="_blank"
                    rel="noopener noreferrer"
                    text="Add CORS origin"
                    mode="ghost"
                    size="large"
                    width="fill"
                  />
                </Flex>
              </Card>
            </Grid>

            <Flex justify="flex-end">
              <Text size={1}>
                <HelpLink
                  href="https://www.sanity.io/docs/cors"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{textDecoration: 'none'}}
                >
                  Need help with CORS? &rarr;
                </HelpLink>
              </Text>
            </Flex>
          </Stack>
        </ContentWrapper>
      </CenteredContainer>
    </Card>
  )
}
