import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import client from 'part:@sanity/base/client'
import config from 'config:sanity'
import Button from 'part:@sanity/components/buttons/default'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import Spinner from 'part:@sanity/components/loading/spinner'
import {of} from 'rxjs'
import {mapTo, catchError, finalize} from 'rxjs/operators'
import styles from './styles/CookieTest.css'

import {openCenteredPopup} from './util/openWindow'

const projectName = (config.project && config.project.name) || ''

const checkCookies = () => {
  return client
    .request({method: 'post', uri: '/auth/testCookie', withCredentials: true})
    .then(() => {
      return client
        .request({uri: '/auth/testCookie', withCredentials: true})
        .then(() => true)
        .catch(() => false)
    })
    .catch((error) => ({error}))
}

const hostname = client.clientConfig.url
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
    // eslint-disable-line class-methods-use-this
    const {SanityLogo, sanityLogo} = this.props
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          {SanityLogo && (
            <div className={styles.sanityLogo}>
              <SanityLogo />
            </div>
          )}
          {sanityLogo && !SanityLogo && <div className={styles.sanityLogo}>{sanityLogo}</div>}
          <div className={styles.branding}>
            <h1 className={BrandLogo ? styles.projectNameHidden : styles.projectName}>
              {projectName}
            </h1>
            {BrandLogo && (
              <div className={styles.brandLogoContainer}>
                <BrandLogo projectName={projectName} />
              </div>
            )}
          </div>

          <div className={styles.title}>
            <h3>We couldn{"'"}t log you in</h3>
          </div>
          <div className={styles.description}>
            <p>Your browser wouldn{"'"}t accept our cookie.</p>
          </div>
          <div className={styles.button}>
            <Button
              color="success"
              inverted
              type="submit"
              onClick={this.handleAcceptCookieButtonClicked}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const {isLoading, isCookieError} = this.state

    if (isLoading) {
      return <Spinner fullscreen center />
    }

    if (isCookieError) {
      return this.renderCookieAcceptContent()
    }

    return <div>{this.props.children}</div>
  }
}

CookieTest.propTypes = {
  sanityLogo: PropTypes.node,
  SanityLogo: PropTypes.func,
}

export default CookieTest
