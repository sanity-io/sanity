import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import client from 'part:@sanity/base/client'
import styles from './styles/LoginDialog.css'
import Button from 'part:@sanity/components/buttons/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'

const checkCookies = () => {
  return client.request({method: 'post', uri: '/auth/testCookie', withCredentials: true}).then(() => true)
    .then(() => {
      return client.request({uri: '/auth/testCookie', withCredentials: true})
        .then(() => true)
        .catch(() => false)
    })
    .then(get => ({isCookieError: !get}))
    .catch(error => ({error}))
}

class CookieCheck extends PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired
  }

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
    const redirectTo = `${client.clientConfig.url}/auth/whitelist?redirectTo=${encodeURIComponent(window.location.toString())}`
    return (
      <div className={styles.root}>

        <div className={styles.sanityStudioLogo}>
          <SanityStudioLogo />
        </div>

        <div className={styles.inner}>

          <h2 className={styles.headline}>Accept the Cookie</h2>
          <p>Your browser didn&apos;t accept our cookie so we&apos;re having trouble logging you in.</p>
          <p>You can explicitly accept it though by clicking below.</p>

          <form
            method="post"
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
      return <div><Spinner message="Running diagnostics..." inline /><p /></div>
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

export default CookieCheck
