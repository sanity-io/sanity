import React, {useState, useEffect} from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import {versionedClient} from './versionedClient'

const checkCors = () =>
  Promise.all([
    versionedClient.request({uri: '/ping', withCredentials: false}).then(() => true),
    versionedClient
      .request({uri: '/users/me', withCredentials: false})
      .then(() => true)
      .catch(() => false),
  ])
    .then((res) => ({
      isCorsError: res[0] && !res[1],
      pingResponded: res[0],
    }))
    .catch((error) => ({error}))

function CorsWrapper({result, children}) {
  const response = result && result.error && result.error.response
  const message = response && response.body && response.body.message
  if (!message) {
    return <>{children}</>
  }

  return (
    <div>
      <p>Error message:</p>
      <pre>
        <code>{response.body.message}</code>
      </pre>
      {children}
    </div>
  )
}

export default function CorsCheck() {
  const [state, setState] = useState({isLoading: true})

  useEffect(() => {
    checkCors().then((res) =>
      setState({
        result: res,
        isLoading: false,
      })
    )
  }, [])

  const {isLoading, result} = state
  const origin =
    window.location.origin ||
    window.location.href.replace(new RegExp(`${window.location.pathname}$`), '')

  if (isLoading) {
    return <Spinner fullscreen center />
  }

  const tld = versionedClient.config().apiHost.replace(/.*?sanity\.([a-z]+).*/, '$1')
  const projectId = versionedClient.config().projectId
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
    return (
      <CorsWrapper result={state.result}>
        <p>
          It looks like the error is being caused by the current origin (<code>{origin}</code>) not
          being allowed for this project. If you are a project administrator or developer, you can
          head to{' '}
          <a rel="noopener noreferrer" target="_blank" href={corsUrl}>
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
      </CorsWrapper>
    )
  }

  if (result.pingResponded) {
    return (
      <CorsWrapper result={state.result}>
        <p>
          Our diagnostics cannot quite determine why this happened. If it was a network glitch you
          could try hitting the <strong>Retry</strong> button below. If you are working as a
          developer on this project, you could also have a look at the browser's dev console and see
          if any issues are listed there.
        </p>
      </CorsWrapper>
    )
  }

  return (
    <CorsWrapper result={state.result}>
      <p>
        It might be that your internet connection is unstable or down. You could try hitting the{' '}
        <strong>Retry</strong> button to see if it was just a temporary glitch.
      </p>
    </CorsWrapper>
  )
}
