import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import config from 'config:sanity'
import {of} from 'rxjs'
import {mapTo, catchError, finalize} from 'rxjs/operators'
import {Container, Text, Button, Heading, Flex, Stack, Spinner} from '@sanity/ui'
import styled from 'styled-components'
import {BrandLogo} from './legacyParts'

import {openCenteredPopup} from './util/openWindow'
import {versionedClient} from './versionedClient'

const BrandLogoWrapper = styled(Flex)`
  height: 3em;

  svg {
    height: 4em;
    width: auto;
    max-width: 70vw;
  }
`

const projectName = (config.project && config.project.name) || ''

const checkCookies = () => {
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

const hostname = versionedClient.clientConfig.url
// const hostname = 'http://localhost:5000/v1'

class CookieTest extends PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {isLoading: true}
    checkCookies().then((isCookieError) => {
      if (!this._isMounted) {
        return
      }

      this.setState({
        isCookieError: !isCookieError,
        isLoading: false,
      })
    })
    this.redirectToUrl = null
    this.popupSubscription = null
  }

  componentDidMount() {
    this._isMounted = true
    this.popupUrl = `${hostname}/auth/views/cookie/interact?redirectTo=${encodeURIComponent(
      window.location.toString()
    )}`
  }

  componentWillUnmount() {
    this._isMounted = false
    if (this.popupSubscription) {
      this.popupSubscription.unsubscribe()
    }
  }

  handleAcceptCookieButtonClicked = () => {
    this.openPopup()
  }

  openPopup = () => {
    openCenteredPopup(this.popupUrl, {
      height: 380,
      width: 640,
      name,
    })
      .pipe(
        mapTo('Successfully performed the cookie allowal routine'),
        finalize(() => window.location.reload()),
        catchError((error) => of(error.message))
      )
      .subscribe(console.log) // eslint-disable-line no-console
  }

  renderCookieAcceptContent() {
    const {SanityLogo, sanityLogo} = this.props
    return (
      <Container width={1} paddingX={3} paddingY={6}>
        <Stack space={7}>
          {SanityLogo && (
            <Flex justify="center">
              <Text>
                <SanityLogo />
              </Text>
            </Flex>
          )}
          {sanityLogo && !SanityLogo && (
            <Flex justify="center">
              <Text>
                <SanityLogo />
              </Text>
            </Flex>
          )}

          {!BrandLogo && projectName && (
            <Heading align="center" as="h1" size={4}>
              {projectName}
            </Heading>
          )}

          {BrandLogo && projectName && (
            <BrandLogoWrapper justify="center">
              <BrandLogo projectName={projectName} />
            </BrandLogoWrapper>
          )}

          <Stack space={5}>
            <Stack space={4}>
              <Text
                align="center"
                as="h2"
                size={3}
                weight="semibold"
                style={{textTransform: 'uppercase'}}
              >
                We couldn't log you in
              </Text>

              <Text size={1} muted align="center">
                Your browser wouldn't accept our cookie.
              </Text>
            </Stack>

            <Flex justify="center">
              <Button
                text="Try again"
                tone="positive"
                mode="ghost"
                onClick={this.handleAcceptCookieButtonClicked}
              />
            </Flex>
          </Stack>
        </Stack>
      </Container>
    )
  }

  render() {
    const {isLoading, isCookieError} = this.state

    if (isLoading) {
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

    if (isCookieError) {
      return this.renderCookieAcceptContent()
    }

    return <div>{this.props.children}</div>
  }
}

CookieTest.propTypes = {
  sanityLogo: PropTypes.node,
  SanityLogo: PropTypes.oneOfType([PropTypes.object, PropTypes.node, PropTypes.func]),
}

export default CookieTest
