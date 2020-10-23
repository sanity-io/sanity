import {omit} from 'lodash'
import React, {PureComponent} from 'react'
import semverCompare from 'semver-compare'
import versions from 'sanity:versions'
import FullscreenMessageDialog from 'part:@sanity/components/dialogs/fullscreen-message?'
import client from 'part:@sanity/base/client'
import {requestIdleCallback, cancelIdleCallback} from '../actions/utils/requestIdleCallback'
import FullscreenError from './FullscreenError'

declare const __DEV__: boolean

const fakeOutdatedModule = false
const fakeOutdatedModuleSeverity = 'high'
let applySeverity = (inp) => inp

if (fakeOutdatedModule) {
  versions['@sanity/base'] = '0.118.0'
  applySeverity = (inp) => {
    const mod = (inp && inp.outdated.find((item) => item.name === '@sanity/base')) || {}
    mod.severity = fakeOutdatedModuleSeverity
    return inp
  }
}

let hasWarned = false

const buildQueryString = () => ({
  // eslint-disable-next-line id-length
  m: Object.keys(versions)
    .filter((pkg) => versions[pkg])
    .map((pkg) => `${pkg}@${versions[pkg]}`),
})

const hashQuery = (items) => items.join(',').replace(/@?sanity[/-]/g, '')
const storage: Storage | Record<string, unknown> =
  typeof sessionStorage === 'undefined' ? {} : sessionStorage

const onVersionCheckError = (err) => {
  // eslint-disable-next-line no-console
  console.warn('Module versions check failed. Dependencies *might* be out of date.', err)
}

const breakify = (lines: string[]): React.ReactNode[] => {
  const nodes: React.ReactNode[] = []
  for (let i = 0; i < lines.length; i++) {
    nodes.push(lines[i])
    if (i !== lines.length - 1) {
      nodes.push(<br key={i} />)
    }
  }
  return nodes
}

const paragraphify = (text) => {
  return text.split('\n\n').map((para, i) => {
    const lines = para.split('\n')
    // eslint-disable-next-line react/no-array-index-key
    return <p key={i}>{breakify(lines)}</p>
  })
}

const getLatestInstalled = () => {
  const versionNums = Object.keys(versions).map((pkg) => versions[pkg])
  const sorted = versionNums.sort(semverCompare)
  return sorted[sorted.length - 1]
}

interface VersionsResponse {
  hash?: string
  result: {
    isSupported: boolean
    isUpToDate: boolean
    outdated?: {name: string; version: string; latest: string}[]
    message?: string
    helpUrl?: string
  }
}

const checkVersions = (options: {getOutdated?: boolean} = {}): Promise<VersionsResponse> => {
  const {getOutdated} = options
  const query = buildQueryString()
  const hash = hashQuery(query.m)
  const local =
    storage.versionCheck &&
    storage.versionCheck.indexOf(hash) === 0 &&
    storage.versionCheck.slice(hash.length + 1)

  if (!getOutdated && local) {
    return Promise.resolve({result: JSON.parse(local)})
  }

  return client
    .request({
      uri: '/versions',
      // resolving the right client definition seems to be an issue :shrug:
      query: buildQueryString() as any,
      json: true,
    })
    .then((result) => ({
      hash,
      result: applySeverity(result),
    }))
}

class VersionChecker extends PureComponent<
  Record<string, unknown>,
  {result?: Omit<VersionsResponse['result'], 'outdated'>}
> {
  static checkVersions = checkVersions
  static getLatestInstalled = getLatestInstalled

  checkTimeout?: number

  constructor(props) {
    super(props)
    this.state = {}
    this.onResponse = this.onResponse.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  onResponse(res: VersionsResponse) {
    // Don't include outdated modules in the stored result
    const result = omit(res.result, ['outdated'])
    if (res.hash && storage) {
      storage.versionCheck = [res.hash, JSON.stringify(result)].join('|')
    }

    // If we have unsupported modules, we want to show a dialog
    if (!result.isSupported) {
      this.setState({result})
    }

    if (__DEV__ && res.result && res.result.outdated) {
      const modules = res.result.outdated.map((mod) => mod.name).join('\n  - ')
      const instructions = 'Run `sanity upgrade` to update them'
      // eslint-disable-next-line no-console
      console.warn(`The following modules are outdated:\n  - ${modules}\n\n${instructions}`)
      hasWarned = true
    }
  }

  handleClose() {
    this.setState({result: undefined})
  }

  componentDidMount() {
    if (hasWarned) {
      return
    }

    this.checkTimeout = requestIdleCallback(() => {
      checkVersions().then(this.onResponse).catch(onVersionCheckError)
    })
  }

  componentWillUnmount() {
    if (this.checkTimeout) {
      cancelIdleCallback(this.checkTimeout)
    }
  }

  render() {
    const result = this.state.result
    if (!result || result.isSupported || result.isSupported === undefined) {
      return null
    }

    const Dialog = FullscreenMessageDialog || FullscreenError
    const title = 'Unsupported module versions'

    return (
      <Dialog color="danger" title={title} onClose={this.handleClose}>
        {paragraphify(result.message || '')}

        {result.helpUrl && (
          <p>
            For more information, please read <a href={result.helpUrl}>{result.helpUrl}</a>
          </p>
        )}
      </Dialog>
    )
  }
}

export default VersionChecker
