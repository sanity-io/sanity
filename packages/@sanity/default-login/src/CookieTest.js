import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import client from 'part:@sanity/base/client'
import config from 'config:sanity'
import styles from './styles/LoginDialog.css'
import Button from 'part:@sanity/components/buttons/default'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import Spinner from 'part:@sanity/components/loading/spinner'

const projectName = (config.project && config.project.name) || ''

const checkCookies = () => {
  return client.request({method: 'post', uri: '/auth/testCookie', withCredentials: true})
    .then(() => {
      return client.request({uri: '/auth/testCookie', withCredentials: true})
        .then(() => true)
        .catch(() => false)
    })
    .then(result => ({isCookieError: !result}))
    .catch(error => ({error}))
}

class CookieTest extends PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired
  };

  constructor(...args) {
    super(...args)
    this.state = {isLoading: true}
  }

  componentWillMount() {
    checkCookies().then(res => this.setState({
      result: res,
      isLoading: false,
    }))
  }

  renderWhiteListForm() { // eslint-disable-line class-methods-use-this
    const {SanityLogo, sanityLogo} = this.props
    const redirectTo = `${client.clientConfig.url}/auth/whitelist?redirectTo=${encodeURIComponent(window.location.toString())}`
    return (
      <div className={styles.root}>

        <div className={styles.inner}>
          { SanityLogo && (
            <div className={styles.sanityLogo}>
              <SanityLogo />
            </div>
          )}
          { sanityLogo && !SanityLogo && (
            <div className={styles.sanityLogo}>
              {sanityLogo}
            </div>
          )}
          <div className={styles.branding}>
            <h1 className={BrandLogo ? styles.projectNameHidden : styles.projectName}>{projectName}</h1>
            {
              BrandLogo && <div className={styles.brandLogoContainer}><BrandLogo projectName={projectName} /></div>
            }
          </div>

          <div className={styles.title}>
            <h2 className={styles.headline}>Accept the Cookie</h2>
          </div>
          <div className={styles.description}>
            <p>Your browser didn&apos;t accept our cookie so we&apos;re having trouble logging you in.</p>
            <p>You can explicitly accept it though by clicking below.</p>
          </div>
          <form
            method="post"
            className={styles.acceptCookieForm}
            action={`${client.clientConfig.url}/auth/testCookie`}
            encType="application/x-www-form-urlencoded"
          >
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Button color="success" inverted type="submit">ACCEPT COOKIE</Button>
          </form>
        </div>
      </div>
    )
  }

  render() {
    const {isLoading, result} = this.state

    if (isLoading) {
      return <Spinner fullscreen center />
    }

    if (result.isCookieError) {
      return this.renderWhiteListForm()
    }

    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

CookieTest.propTypes = {
  sanityLogo: PropTypes.node,
  SanityLogo: PropTypes.func
}

export default CookieTest
