import React, {useEffect, useMemo, useState} from 'react'
import {Container, Text, Flex, Spinner} from '@sanity/ui'
import {fetchToken, saveToken} from '@sanity/base/_internal'
import {versionedClient} from './versionedClient'
import {LoginDialog, pluginConfig} from './legacyParts'

const isProjectLogin = versionedClient.config().useProjectHostname
const projectId: string | null =
  (isProjectLogin && versionedClient.config && versionedClient.config().projectId) || null

const testCookieSupport = () => {
  return versionedClient
    .request({
      method: 'POST',
      uri: '/auth/testCookie',
      withCredentials: true,
      tag: 'auth.cookie-test',
    })
    .then(() => {
      return versionedClient
        .request({
          method: 'GET',
          uri: '/auth/testCookie',
          withCredentials: true,
          tag: 'auth.cookie-test',
        })
        .then(() => true)
        .catch(() => false)
    })
    .catch((error) => ({error}))
}

const redirectFromTokenFetchUrl = () => {
  const url = new URL(window.location.href)
  const uParams = new URLSearchParams(url.search)
  uParams.delete('sid')
  uParams.delete('url')
  window.location.search = uParams.toString()
}

interface Props {
  children: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  SanityLogo: React.ReactNode | React.ReactElement
}

export default function CookieTest(props: Props) {
  const [loading, setLoading] = useState(true)
  const {loginMethods} = pluginConfig
  const [hasCookieSupport, setHasCookieSupport] = useState(true)

  const sid = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('sid')
  }, [])

  /* first condition checks if the loginMethods key exists in the config,
    if it doesn't, then you should go with the default (add support for older studios)

    second condition checks if the loginMethods are empty which means it should use the default
    way too.
    
    third it checks if it has both the cookie and token items in the array */
  const hasBothMethods =
    !loginMethods ||
    loginMethods.length === 0 ||
    (loginMethods.includes('cookie') && loginMethods.includes('token'))

  /* where the method for login that was defined in the config is always the token */
  const onlyUseToken =
    loginMethods && loginMethods.includes('token') && !loginMethods.includes('cookie')

  useEffect(() => {
    if (sid && projectId) {
      fetchToken(sid)
        .then((res) => {
          saveToken({token: res.token, projectId})
          redirectFromTokenFetchUrl()
        })
        .catch(() => {
          redirectFromTokenFetchUrl()
        })
    } else {
      testCookieSupport().then((supportsCookies) => {
        if (!supportsCookies) {
          setHasCookieSupport(false)
        }
        setLoading(false)
      })
    }
  }, [sid])

  if (loading) {
    return (
      <Container width={4} padding={4} height="fill">
        <Flex align="center" justify="center" height="fill">
          <Text>
            <Spinner />
          </Text>
        </Flex>
      </Container>
    )
  }
  /* check if it can use both methods (cookie and token) AND doesn't have cookie support 
    this is the default and targets cases like Safari
    or
    if the config has set only token, then it should always go with this path
  */
  if ((hasBothMethods && !hasCookieSupport) || onlyUseToken) {
    return (
      <LoginDialog
        title={props.title}
        description={props.description}
        SanityLogo={props.SanityLogo}
        projectId={projectId}
        type="token"
      />
    )
  }
  return props.children
}
