import React from 'react'
import {SanityLogo as SanityLogotype} from '@sanity/logos'
import {Spinner, Container, Flex} from '@sanity/ui'
import {useCurrentUser} from '@sanity/base/hooks'
import ErrorDialog from './ErrorDialog'
import UnauthorizedUser from './UnauthorizedUser'
import {versionedClient} from './versionedClient'
import {userStore, LoginDialog} from './legacyParts'

interface Props {
  children: React.ReactNode
  title?: string
  description?: React.ReactNode
  sanityLogo?: React.ReactNode
  SanityLogo?: React.ReactNode
  LoadingScreen: React.ReactNode
}

const defaultLoadingScreen = (
  <Container padding={4} height="fill">
    <Flex justify="center" align="center" height="fill">
      <Spinner />
    </Flex>
  </Container>
)

const handleRetry = userStore.actions.retry

function getProjectId(): string | undefined {
  const {useProjectHostname, projectId} = versionedClient.config()
  return useProjectHostname ? projectId : undefined
}

export default function LoginWrapper(props: Props) {
  const {
    title = 'Choose a login provider',
    SanityLogo = SanityLogotype,
    LoadingScreen = defaultLoadingScreen,
    description,
    sanityLogo,
    children,
  } = props

  const projectId = getProjectId()
  const {value: user, isLoading, error} = useCurrentUser()

  if (sanityLogo) {
    const warning =
      'sanityLogo is a deprecated property on LoginWrapper. Pass a React component to the SanityLogo property instead.'
    console.warn(warning) // eslint-disable-line no-console
  }

  if (isLoading) {
    return typeof LoadingScreen === 'function' ? <LoadingScreen center fullscreen /> : LoadingScreen
  }

  if (error) {
    return <ErrorDialog onRetry={handleRetry} error={error} />
  }

  if (!user) {
    return (
      <LoginDialog
        title={title}
        description={description}
        SanityLogo={SanityLogo}
        projectId={projectId}
      />
    )
  }

  if (projectId && !user.role) {
    return <UnauthorizedUser user={user} />
  }

  return typeof children === 'function' ? children(user) : <>{children}</>
}
