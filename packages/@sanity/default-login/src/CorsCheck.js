import React, {PureComponent} from 'react'
import client from 'part:@sanity/base/client'
import Spinner from 'part:@sanity/components/loading/spinner'

const checkCors = () => Promise.all([
  client.request({uri: '/ping', withCredentials: false}).then(() => true),
  client.request({uri: '/users/me', withCredentials: false}).then(() => true).catch(() => false)
]).then(res => ({
  isCorsError: res[0] && !res[1],
  pingResponded: res[0]
})).catch(error => ({error}))

const linkRel = 'noopener noreferrer'

class CorsCheck extends PureComponent {
  constructor(...args) {
    super(...args)
    this.state = {isLoading: true}
  }

  componentWillMount() {
    checkCors().then(res => this.setState({
      result: res,
      isLoading: false
    }))
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
        <pre><code>{response.body.message}</code></pre>
        {content}
      </div>
    )
  }

  render() {
    const {isLoading, result} = this.state
    const origin = window.location.origin
      || window.location.href.replace(new RegExp(`${window.location.pathname}$`), '')

    if (isLoading) {
      return <div><Spinner message="Running diagnostics..." inline /><p /></div>
    }

    const tld = client.config().apiHost.replace(/.*?sanity\.([a-z]+).*/, '$1')
    const projectId = client.config().projectId
    const corsUrl = `https://sanity.${tld}/manage/projects/${projectId}/#cors`
    const response = result.error && result.error.response

    if (response) {
      const is404 = response.statusCode === 404
      const errType = response.body.attributes && response.body.attributes.type
      if (is404 && errType === 'project') {
        return (
          <div>
            <p>
              {response.body.message || response.statusCode}
            </p>
            <p>
              Double-check that your <code>sanity.json</code> points to the right project ID?
            </p>
          </div>
        )
      }
    }

    if (result.isCorsError) {
      return this.renderWrapper(
        <p>
          It seems the error could be caused by the current origin (<code>{origin}</code>) not
          being an allowed origin for this project.

          If you are an administrator or developer of the project, you can head
          to <a rel={linkRel} target="_blank" href={corsUrl}>the project management</a> interface
          and add the origin under the <em>CORS Origins</em> section.
        </p>
      )
    }

    if (result.pingResponded) {
      return this.renderWrapper(
        <p>
          The cause of this error is a little uncertain. It could be a temporary glitch, in which
          case you might want to try hitting the <strong>Retry</strong> button below. If you are
          the developer of this project, you could take a look at the browsers developer console
          and see if any issues are reported there.
        </p>
      )
    }

    return this.renderWrapper(
      <p>
        It might be that your internet connection is unstable or down, or it <em>might</em> be the
        Sanity API is having some issues, in which case it should hopefully be back up soon!
        You could also try hitting the <strong>Retry</strong> button and see if it was just
        a temporary glitch.
      </p>
    )
  }
}

export default CorsCheck
