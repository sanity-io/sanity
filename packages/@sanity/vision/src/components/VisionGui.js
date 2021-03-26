/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import SplitPane from 'react-split-pane'
import {PlayIcon} from '@sanity/icons'
import {Flex, Card, Button, Stack, Box, Label, Select, Text, TextInput} from '@sanity/ui'
import studioClient from 'part:@sanity/base/client'
import {storeState, getState} from '../util/localState'
import parseApiQueryString from '../util/parseApiQueryString'
import tryParseParams from '../util/tryParseParams'
import encodeQueryString from '../util/encodeQueryString'
import {apiVersions} from '../apiVersions'
import DelayedSpinner from './DelayedSpinner'
import QueryEditor from './QueryEditor'
import ParamsEditor from './ParamsEditor'
import ResultView from './ResultView'
import NoResultsDialog from './NoResultsDialog'
import QueryErrorDialog from './QueryErrorDialog'

/* eslint-disable import/no-unassigned-import, import/no-unresolved */
import 'codemirror/lib/codemirror.css?raw'
import 'codemirror/theme/material.css?raw'
import 'codemirror/addon/hint/show-hint.css?raw'
/* eslint-enable import/no-unassigned-import, import/no-unresolved */

const NO_POINTER_EVENTS = {pointerEvents: 'none'}
const sanityUrl = /\.api\.sanity\.io\/(vx|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/

const handleCopyUrl = () => {
  const emailLink = document.querySelector('#vision-query-url')
  emailLink.select()

  try {
    document.execCommand('copy')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unable to copy to clipboard :(')
  }
}

class VisionGui extends React.PureComponent {
  constructor(props) {
    super(props)

    const lastQuery = getState('lastQuery')
    const lastParams = getState('lastParams')

    const firstDataset = this.props.datasets[0] && this.props.datasets[0].name
    const defaultDataset = studioClient.config().dataset || firstDataset
    const defaultApiVersion = `v${studioClient.config().apiVersion || '1'}`

    let dataset = getState('dataset', defaultDataset)
    let apiVersion = getState('apiVersion', defaultApiVersion)

    if (!this.props.datasets.some(({name}) => name === dataset)) {
      dataset = defaultDataset
    }

    if (!apiVersions.includes(apiVersion)) {
      apiVersion = apiVersions[0]
    }

    this._queryEditorContainer = React.createRef()
    this._paramsEditorContainer = React.createRef()

    this.client = studioClient.withConfig({apiVersion, dataset})

    this.subscribers = {}
    this.state = {
      query: lastQuery,
      params: lastParams && tryParseParams(lastParams),
      rawParams: lastParams,
      queryInProgress: false,
      dataset,
      apiVersion,
    }

    this.handleChangeDataset = this.handleChangeDataset.bind(this)
    this.handleChangeApiVersion = this.handleChangeApiVersion.bind(this)
    this.handleCustomApiVersionChange = this.handleCustomApiVersionChange.bind(this)
    this.handleListenExecution = this.handleListenExecution.bind(this)
    this.handleListenerCancellation = this.handleListenerCancellation.bind(this)
    this.handleListenerMutation = this.handleListenerMutation.bind(this)
    this.handleQueryExecution = this.handleQueryExecution.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleParamsChange = this.handleParamsChange.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
  }

  componentDidMount() {
    window.document.addEventListener('paste', this.handlePaste)
  }

  componentWillUnmount() {
    this.cancelQuery()
    this.cancelListener()
  }

  handlePaste(evt) {
    const data = evt.clipboardData.getData('text/plain')
    const match = data.match(sanityUrl)
    if (!match) {
      return
    }

    const [, apiVersion, dataset, urlQuery] = match
    const qs = queryString.parse(urlQuery)
    let parts

    try {
      parts = parseApiQueryString(qs)
    } catch (err) {
      console.warn('Error while trying to parse API URL: ', err.message) // eslint-disable-line no-console
      return // Give up on error
    }

    if (this.state.data !== dataset) {
      storeState('dataset', dataset)
    }

    if (this.state.apiVersion !== apiVersion) {
      storeState('apiVersion', apiVersion)
    }

    evt.preventDefault()
    this.client.config({dataset, apiVersion})
    this.setState(
      {
        dataset,
        apiVersion,
        query: parts.query,
        params: parts.params,
        rawParams: JSON.stringify(parts.params, null, 2),
      },
      () => {
        this.handleQueryExecution()
      }
    )
  }

  cancelQuery() {
    if (!this.subscribers.query) {
      return
    }

    this.subscribers.query.unsubscribe()
    this.subscribers.query = null
  }

  cancelListener() {
    if (!this.subscribers.listen) {
      return
    }

    this.subscribers.listen.unsubscribe()
    this.subscribers.listen = null
  }

  handleChangeDataset(evt) {
    const dataset = evt.target.value
    storeState('dataset', dataset)
    this.setState({dataset})
    this.client.config({dataset})
    this.handleQueryExecution()
  }

  handleChangeApiVersion(evt) {
    const apiVersion = evt.target.value
    if (apiVersion === 'other') {
      this.setState({customApiVersion: true})
      return
    }

    storeState('apiVersion', apiVersion)
    this.setState({apiVersion, customApiVersion: undefined})
    this.client.config({apiVersion})
    this.handleQueryExecution()
  }

  handleCustomApiVersionChange(evt) {
    const customApiVersion = evt.target.value
    const parseableApiVersion = customApiVersion
      .replace(/^v/, '')
      .trim()
      .match(/^\d{4}-\d{2}-\d{2}$/)

    const isValidApiVersion = !isNaN(Date.parse(parseableApiVersion))

    this.setState(
      (prevState) => ({
        apiVersion: isValidApiVersion ? customApiVersion : prevState.apiVersion,
        customApiVersion: customApiVersion || true,
        isValidApiVersion,
      }),
      () => {
        if (!this.state.isValidApiVersion) {
          return
        }

        this.client.config({apiVersion: this.state.customApiVersion})
      }
    )
  }

  handleListenerMutation(mut) {
    // eslint-disable-next-line react/no-access-state-in-setstate
    const listenMutations = [mut].concat(this.state.listenMutations)
    if (listenMutations.length > 50) {
      listenMutations.pop()
    }

    this.setState({listenMutations})
  }

  handleListenerCancellation() {
    if (!this.state.listenInProgress) {
      return
    }

    this.cancelListener()
    this.setState({listenInProgress: false})
  }

  handleListenExecution() {
    const {query, params, rawParams, listenInProgress} = this.state
    if (listenInProgress) {
      this.cancelListener()
      this.setState({listenInProgress: false})
      return
    }

    const paramsError = params instanceof Error && params
    const url = this.client.getUrl(
      this.client.getDataUrl('listen', encodeQueryString(query, params))
    )
    storeState('lastQuery', query)
    storeState('lastParams', rawParams)

    this.cancelQuery()

    this.setState({
      url,
      listenMutations: [],
      queryInProgress: false,
      listenInProgress: !paramsError && Boolean(query),
      error: paramsError || undefined,
      result: undefined,
      queryTime: null,
      e2eTime: null,
    })

    if (!query || paramsError) {
      return
    }

    this.subscribers.listen = this.client.listen(query, params, {}).subscribe({
      next: this.handleListenerMutation,
      error: (error) =>
        this.setState({
          error,
          query,
          listenInProgress: false,
        }),
    })
  }

  handleQueryExecution() {
    const {query, params, rawParams} = this.state
    const paramsError = params instanceof Error && params
    storeState('lastQuery', query)
    storeState('lastParams', rawParams)

    this.cancelListener()

    this.setState({
      queryInProgress: !paramsError && Boolean(query),
      listenInProgress: false,
      listenMutations: [],
      error: paramsError || undefined,
      result: undefined,
      queryTime: null,
      e2eTime: null,
    })

    if (!query || paramsError) {
      return
    }

    const url = this.client.getUrl(
      this.client.getDataUrl('query', encodeQueryString(query, params))
    )
    const queryStart = Date.now()

    this.subscribers.query = this.client.observable
      .fetch(query, params, {filterResponse: false})
      .subscribe({
        next: (res) =>
          this.setState({
            executedQuery: query,
            url,
            queryTime: res.ms,
            e2eTime: Date.now() - queryStart,
            result: res.result,
            queryInProgress: false,
            error: null,
          }),
        error: (error) =>
          this.setState({
            error,
            query,
            queryInProgress: false,
          }),
      })
  }

  handleQueryChange(data) {
    this.setState({query: data.query})
  }

  handleParamsChange(data) {
    this.setState({rawParams: data.raw, params: data.parsed})
  }

  render() {
    const {datasets} = this.props
    const {
      error,
      result,
      url,
      query,
      queryInProgress,
      executedQuery,
      listenInProgress,
      queryTime,
      e2eTime,
      listenMutations,
      apiVersion,
      dataset,
      customApiVersion,
      isValidApiVersion,
    } = this.state
    const styles = this.context.styles.visionGui
    const hasResult = !error && !queryInProgress && typeof result !== 'undefined'
    const hasEmptyResult = hasResult && Array.isArray(result) && result.length === 0

    // Note that because of react-json-inspector, we need at least one
    // addressable, non-generated class name. Therefore;
    // leave `sanity-vision` untouched!
    const visionClass = ['sanity-vision', this.context.styles.visionGui.root]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={visionClass}>
        <Card className={styles.header}>
          <Flex>
            {/* Dataset selector */}
            <Box padding={1}>
              <Stack>
                <Card padding={2}>
                  <Label>Dataset</Label>
                </Card>
                <Select value={dataset} onChange={this.handleChangeDataset}>
                  {datasets.map((ds) => (
                    <option key={ds.name}>{ds.name}</option>
                  ))}
                </Select>
              </Stack>
            </Box>

            {/* API version selector */}
            <Box padding={1}>
              <Stack>
                <Card padding={2}>
                  <Label>API version</Label>
                </Card>
                <Select
                  value={customApiVersion ? 'other' : apiVersion}
                  onChange={this.handleChangeApiVersion}
                >
                  {apiVersions.map((version) => (
                    <option key={version}>{version}</option>
                  ))}
                  <option key="other" value="other">
                    Other
                  </option>
                </Select>
              </Stack>
            </Box>

            {/* Custom API version input */}
            {customApiVersion && (
              <Box padding={1}>
                <Stack>
                  <Card padding={2}>
                    <Label>Custom API version</Label>
                  </Card>

                  <TextInput
                    value={typeof customApiVersion === 'string' ? customApiVersion : ''}
                    onChange={this.handleCustomApiVersionChange}
                    customValidity={isValidApiVersion ? undefined : 'Invalid API version'}
                  />
                </Stack>
              </Box>
            )}

            {/* Query URL (for copying) */}
            {typeof url === 'string' ? (
              <Box padding={1} flex={1}>
                <Stack>
                  <Card padding={2}>
                    <Label>
                      Query URL&nbsp;
                      <a onClick={handleCopyUrl} className={styles.queryUrlCopy}>
                        [copy]
                      </a>
                    </Label>
                  </Card>
                  <TextInput readOnly id="vision-query-url" value={url} />
                </Stack>
              </Box>
            ) : (
              <Box flex={1} />
            )}

            {/* Execution time */}
            {typeof queryTime === 'number' && (
              <Box padding={1}>
                <Stack>
                  <Card padding={2}>
                    <Label>Timings</Label>
                  </Card>
                  <Stack space={2}>
                    <Text size={2}>Execution: {queryTime}ms</Text>
                    <Text size={2}>End-to-end: {e2eTime}ms</Text>
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* Controls (listen/run) */}
            <Box padding={1}>
              <Stack>
                <Card padding={2}>
                  <Label align="right">Controls</Label>
                </Card>
                <Flex>
                  <Card onClick={this.handleListenerCancellation}>
                    <Button
                      style={listenInProgress ? NO_POINTER_EVENTS : undefined}
                      onClick={this.handleListenExecution}
                      loading={listenInProgress}
                      type="button"
                      text="Listen"
                      mode="ghost"
                    />
                  </Card>

                  <Card marginLeft={1}>
                    <Button
                      onClick={this.handleQueryExecution}
                      icon={PlayIcon}
                      loading={queryInProgress}
                      tone="primary"
                      text="Run query"
                    />
                  </Card>
                </Flex>
              </Stack>
            </Box>
          </Flex>
        </Card>
        <div className={styles.splitContainer}>
          <SplitPane split="vertical" minSize={150} defaultSize={400}>
            <div className={styles.edit}>
              <SplitPane split="horizontal" defaultSize={'80%'}>
                <div className={styles.inputContainer} ref={this._queryEditorContainer}>
                  <h3 className={styles.inputLabelQuery || 'query'}>Query</h3>
                  <QueryEditor
                    className={styles.queryEditor}
                    value={this.state.query}
                    onExecute={this.handleQueryExecution}
                    onChange={this.handleQueryChange}
                    schema={this.props.schema}
                  />
                </div>
                <div className={styles.inputContainer} ref={this._paramsEditorContainer}>
                  <h3 className={styles.inputLabelQuery || 'query'}>Params</h3>
                  <ParamsEditor
                    className={styles.paramsEditor}
                    classNameInvalid={styles.paramsEditorInvalid}
                    value={this.state.rawParams}
                    onExecute={this.handleQueryExecution}
                    onChange={this.handleParamsChange}
                  />
                </div>
              </SplitPane>
            </div>
            <div className={styles.resultContainer}>
              <h3 className={styles.inputLabelQuery || 'resultLabel'}>Result</h3>
              <div className={styles.result}>
                {queryInProgress && <DelayedSpinner />}
                {error && <QueryErrorDialog error={error} />}
                {hasResult && !hasEmptyResult && <ResultView data={result} query={query} />}
                {hasEmptyResult && (
                  <div className={styles.noResult}>
                    <NoResultsDialog query={executedQuery} dataset={dataset} />
                  </div>
                )}
                {listenMutations && listenMutations.length > 0 && (
                  <ResultView data={listenMutations} />
                )}
              </div>
            </div>
          </SplitPane>
        </div>
      </div>
    )
  }
}

VisionGui.propTypes = {
  schema: PropTypes.object,
  datasets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ),
}

VisionGui.contextTypes = {
  styles: PropTypes.object,
  components: PropTypes.object,
}

export default VisionGui
