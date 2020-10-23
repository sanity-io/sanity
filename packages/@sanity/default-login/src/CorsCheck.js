import React, {PureComponent} from 'react'
import client from 'part:@sanity/base/client'
import Spinner from 'part:@sanity/components/loading/spinner'

const checkCors = () =>
  Promise.all([
    client.request({uri: '/ping', withCredentials: false}).then(() => true),
    client
      .request({uri: '/users/me', withCredentials: false})
      .then(() => true)
      .catch(() => false),
  ])
    .then((res) => ({
      isCorsError: res[0] && !res[1],
      pingResponded: res[0],
    }))
    .catch((error) => ({error}))

const linkRel = 'noopener noreferrer'

class CorsCheck extends PureComponent {
  constructor(...args) {
    super(...args)
    this.state = {isLoading: true}
  }

  UNSAFE_componentWillMount() {
    checkCors().then((res) =>
      this.setState({
        result: res,
        isLoading: false,
      })
    )
  }

  renderWrapper(content) {
    const result = this.state.result
    const response = result && result.error && result.error.response
    const message = response && response.body && response.body.message
    if (!message) {
      return content
    }

    return (
      <div>
        <p>Error message:</p>
        <pre>
          <code>{response.body.message}</code>
        </pre>
        {content}
      </div>
    )
  }

  render() {
    const {isLoading, result} = this.state
    const origin =
      window.location.origin ||
      window.location.href.replace(new RegExp(`${window.location.pathname}$`), '')

    if (isLoading) {
      return <Spinner fullscreen center />
    }

    const tld = client.config().apiHost.replace(/.*?sanity\.([a-z]+).*/, '$1')
    const projectId = client.config().projectId
    const corsUrl = `https://manage.sanity.${tld}/projects/${projectId}/settings/api`
    const response = result.error && result.error.response

    if (response) {
      const is404 = response.statusCode === 404
      const errType = response.body.attributes && response.body.attributes.type
      if (is404 && errType === 'project') {
        return (
          <div>
            <p>{response.body.message || response.statusCode}</p>
            <p>
              Double-check that your <code>sanity.json</code> points to the right project ID!
            </p>
          </div>
        )
      }
    }

    if (result.isCorsError) {
      return this.renderWrapper(
        <p>
          It looks like the error is being caused by the current origin (<code>{origin}</code>) not
          being allowed for this project. If you are a project administrator or developer, you can
          head to{' '}
          <a rel={linkRel} target="_blank" href={corsUrl}>
            the project management
          </a>{' '}
          interface. Add the origin under the{' '}
          <a
            href="https://www.sanity.io/docs/front-ends/cors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <em>CORS Origins</em>
          </a>{' '}
          section. Do remember to <code>allow credentials</code>!
        </p>
      )
    }

    if (result.pingResponded) {
      return this.renderWrapper(
        <p>
          Our diagnostics cannot quite determine why this happened. If it was a network glitch you
          could try hitting the <strong>Retry</strong> button below. If you are working as a
          developer on this project, you could also have a look at the browser's dev console and see
          if any issues are listed there.
        </p>
      )
    }

    return this.renderWrapper(
      <p>
        It might be that your internet connection is unstable or down. You could try hitting the{' '}
        <strong>Retry</strong> button to see if it was just a temporary glitch.
      </p>
    )
  }
}

export default CorsCheck
