import React, {PureComponent} from 'react'
import FullscreenError from './FullscreenError'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen?'
import client from 'part:@sanity/base/client'
import versions from 'sanity:versions'

const onIdle = typeof window.requestIdleCallback === 'function'
  ? window.requestIdleCallback
  : cb => setTimeout(cb, 0)

// eslint-disable-next-line id-length
const buildQueryString = () => ({m: Object.keys(versions).map(pkg => `${pkg}@${versions[pkg]}`)})
const hashQuery = items => items.join(',').replace(/@?sanity[/-]/g, '')
const storage = typeof sessionStorage === 'undefined' ? {} : sessionStorage

const onVersionCheckError = err => {
  // eslint-disable-next-line no-console
  console.warn('Module versions check failed. Dependencies *might* be out of date.', err)
}

const breakify = lines => {
  const nodes = []
  for (let i = 0; i < lines.length; i++) {
    nodes.push(lines[i])
    if (i !== lines.length - 1) {
      nodes.push(<br key={i} />)
    }
  }
  return nodes
}

const paragraphify = text => {
  return text.split('\n\n').map((para, i) => {
    const lines = para.split('\n')
    // eslint-disable-next-line react/no-array-index-key
    return <p key={i}>{breakify(lines)}</p>
  })
}

const checkVersions = () => {
  const query = buildQueryString()
  const hash = hashQuery(query.m)
  const local = (
    storage.versionCheck
    && storage.versionCheck.indexOf(hash) === 0
    && storage.versionCheck.slice(hash.length + 1)
  )

  if (local) {
    return Promise.resolve({result: JSON.parse(local)})
  }

  return client.request({
    uri: '/versions',
    query: buildQueryString(),
    json: true
  }).then(result => ({hash, result}))
}

class VersionChecker extends PureComponent {
  constructor(...args) {
    super(...args)
    this.state = {}
    this.onResponse = this.onResponse.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  onResponse(res) {
    if (res.hash && storage) {
      storage.versionCheck = [res.hash, JSON.stringify(res.result)].join('|')
    }

    if (!res.result.isSupported) {
      this.setState({result: res.result})
    }

    if (__DEV__ && res.result.outdated) {
      const modules = res.result.outdated.join('\n  - ')
      const instructions = 'Run `sanity upgrade` to update them'
      // eslint-disable-next-line no-console
      console.warn(`The following modules are outdated:\n  - ${modules}\n\n${instructions}`)
    }
  }

  handleClose() {
    this.setState({result: null})
  }

  componentDidMount() {
    onIdle(() => checkVersions().then(this.onResponse).catch(onVersionCheckError))
  }

  render() {
    const result = this.state.result
    if (!result || result.isSupported || result.isSupported === undefined) {
      return null
    }

    const Dialog = FullscreenDialog || FullscreenError
    const title = 'Unsupported module versions'

    return (
      <Dialog centered isOpen color="danger" title={title} onClose={this.handleClose}>
        {paragraphify(result.message || '')}

        {result.helpUrl && (
          <p>For more information, please read <a href={result.helpUrl}>{result.helpUrl}</a></p>
        )}
      </Dialog>
    )
  }
}

export default VersionChecker
