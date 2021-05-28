/* eslint-disable complexity */
import React from 'react'
import queryString from 'query-string'
import SplitPane from 'react-split-pane'
import {CopyIcon, PlayIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Label, Layer, Select, Stack, Text, TextInput} from '@sanity/ui'
import studioClient from 'part:@sanity/base/client'
// import {SanityClient} from '@sanity/client'
import {Subscription} from 'rxjs'
import {storeState, getState} from '../util/localState'
import {parseApiQueryString} from '../util/parseApiQueryString'
import {tryParseParams} from '../util/tryParseParams'
import {encodeQueryString} from '../util/encodeQueryString'
import {apiVersions} from '../apiVersions'
import {DelayedSpinner} from './DelayedSpinner'
import {CodeEditor, CodeEditorCursor} from './codeEditor'
import {ResultView} from './ResultView'
import {NoResultsDialog} from './NoResultsDialog'
import {QueryErrorDialog} from './QueryErrorDialog'
import './react-split-pane.css'

import styles from './VisionGui.css'

export interface VisionGuiProps {
  datasets: {name: string}[]
  schema?: any
}

export interface VisionGuiState {
  queryCursor: CodeEditorCursor
  paramsCursor: CodeEditorCursor
  data?: string
  query: string
  params?: Record<string, unknown>
  queryInProgress: boolean
  dataset: string
  apiVersion: string
  rawParams: string
  customApiVersion?: boolean
  isValidApiVersion?: boolean
  listenInProgress?: boolean
  url?: string
  listenMutations?: unknown[]
  error?: Error | null
  result?: unknown
  queryTime?: null
  e2eTime?: number | null
  executedQuery?: string
}

const NO_POINTER_EVENTS: React.CSSProperties = {pointerEvents: 'none'}
const sanityUrl = /\.api\.sanity\.io\/(vx|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/

const handleCopyUrl = () => {
  const emailLink = document.querySelector('#vision-query-url')

  if (emailLink instanceof HTMLInputElement) {
    emailLink.select()
  }

  try {
    document.execCommand('copy')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unable to copy to clipboard :(')
  }
}

export class VisionGui extends React.PureComponent<VisionGuiProps, VisionGuiState> {
  _queryEditorContainer: React.RefObject<HTMLDivElement>
  _paramsEditorContainer: React.RefObject<HTMLDivElement>

  // @todo: Fix typings so that using `SanityClient` works
  // client?: SanityClient
  client?: any
  subscribers: {
    query?: Subscription | null
    listen?: Subscription | null
  }

  constructor(props: VisionGuiProps) {
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
      queryCursor: {line: 0, column: 0},
      params: lastParams && tryParseParams(lastParams),
      paramsCursor: {line: 0, column: 0},
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
    this.handleQueryCursorChange = this.handleQueryCursorChange.bind(this)
    this.handleParamsChange = this.handleParamsChange.bind(this)
    this.handleParamsCursorChange = this.handleParamsCursorChange.bind(this)
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

  handleListenerMutation(mut: any) {
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

    const paramsError = params instanceof Error ? params : undefined
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
      error: paramsError,
      result: undefined,
      queryTime: null,
      e2eTime: null,
    })

    if (!query || paramsError) {
      return
    }

    this.subscribers.listen = this.client.listen(query, params, {}).subscribe({
      next: this.handleListenerMutation,
      error: (error: Error) =>
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
    this.setState({url})

    const queryStart = Date.now()

    this.subscribers.query = this.client.observable
      .fetch(query, params, {filterResponse: false, tag: 'vision'})
      .subscribe({
        next: (res) =>
          this.setState({
            executedQuery: query,
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

  handleQueryChange(query: string) {
    this.setState({query})
  }

  handleQueryCursorChange(queryCursor: CodeEditorCursor) {
    this.setState({queryCursor})
  }

  handleParamsChange(data: string) {
    this.setState({rawParams: data, params: tryParseParams(data)})
  }

  handleParamsCursorChange(paramsCursor: CodeEditorCursor) {
    this.setState({paramsCursor})
  }

  render() {
    const {datasets} = this.props
    const {
      error,
      result,
      url,
      // query,
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

    const hasResult = !error && !queryInProgress && typeof result !== 'undefined'
    const hasEmptyResult = hasResult && Array.isArray(result) && result.length === 0

    // Note that because of react-json-inspector, we need at least one
    // addressable, non-generated class name. Therefore;
    // leave `sanity-vision` untouched!
    // const visionClass = ['sanity-vision', styles.root].filter(Boolean).join(' ')

    return (
      <Card
        // borderTop
        className="sanity-vision"
        height="fill"
        overflow="hidden"
        // scheme="dark"
        sizing="border"
        style={{display: 'flex', flexDirection: 'column'}}
      >
        <Layer zOffset={10}>
          <Card paddingX={3} paddingY={2} shadow={1}>
            <Flex align="center" gap={2}>
              {/* Dataset selector */}
              {datasets && datasets.length > 0 && (
                <Card padding={1} radius={2} tone="transparent">
                  <Flex align="center">
                    <Box padding={2}>
                      <Label>Dataset</Label>
                    </Box>
                    <Select padding={2} value={dataset} onChange={this.handleChangeDataset}>
                      {datasets.map((ds) => (
                        <option key={ds.name}>{ds.name}</option>
                      ))}
                    </Select>
                  </Flex>
                </Card>
              )}

              {/* API version selector */}
              <Card padding={1} radius={2} tone="transparent">
                <Flex align="center">
                  <Box padding={2}>
                    <Label>API version</Label>
                  </Box>
                  <Box>
                    <Select
                      padding={2}
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
                  </Box>
                </Flex>
              </Card>

              {/* Custom API version input */}
              {customApiVersion && (
                <Card padding={1} radius={2} tone="transparent">
                  <Flex align="center">
                    <Box padding={2}>
                      <Label>Custom API version</Label>
                    </Box>
                    <Box>
                      <TextInput
                        padding={2}
                        value={typeof customApiVersion === 'string' ? customApiVersion : ''}
                        onChange={this.handleCustomApiVersionChange}
                        customValidity={isValidApiVersion ? undefined : 'Invalid API version'}
                      />
                    </Box>
                  </Flex>
                </Card>
              )}

              {/* Query URL (for copying) */}
              {
                <Card flex={1} padding={1} radius={2} tone="transparent">
                  <Flex align="center">
                    <Box padding={2}>
                      <Label>Query URL</Label>
                    </Box>
                    <Box flex={1}>
                      <TextInput
                        // clearButton={url ? {icon: CopyIcon} : undefined}
                        disabled={!url}
                        padding={2}
                        readOnly={Boolean(url)}
                        id="vision-query-url"
                        suffix={
                          url ? (
                            <Box padding={1} style={{lineHeight: 0}}>
                              <Button
                                as="a"
                                icon={CopyIcon}
                                mode="bleed"
                                onClick={handleCopyUrl}
                                padding={1}
                              />
                            </Box>
                          ) : undefined
                        }
                        value={url || ''}
                      />
                    </Box>
                  </Flex>
                </Card>
              }

              {/* Execution time */}
              {typeof queryTime === 'number' && (
                <Card padding={1} radius={2} tone="transparent">
                  <Flex align="center">
                    <Box padding={2}>
                      <Label>Timings</Label>
                    </Box>
                    <Stack paddingX={2} space={2}>
                      <Text size={0}>Execution: {queryTime}ms</Text>
                      <Text size={0}>End-to-end: {e2eTime}ms</Text>
                    </Stack>
                  </Flex>
                </Card>
              )}

              {/* Controls (listen/run) */}
              <Flex align="center">
                <Box hidden padding={2}>
                  <Label align="right">Controls</Label>
                </Box>
                <Flex gap={1}>
                  <Button
                    style={listenInProgress ? NO_POINTER_EVENTS : undefined}
                    onClick={
                      listenInProgress
                        ? this.handleListenerCancellation
                        : this.handleListenExecution
                    }
                    loading={listenInProgress}
                    type="button"
                    text="Listen"
                    mode="ghost"
                  />
                  <Button
                    onClick={this.handleQueryExecution}
                    icon={PlayIcon}
                    loading={queryInProgress}
                    tone="primary"
                    text="Run query"
                  />
                </Flex>
              </Flex>
            </Flex>
          </Card>
        </Layer>

        <div className={styles.splitContainer}>
          <SplitPane split="vertical" minSize={150} defaultSize={400}>
            {/* Edit query and params */}
            <div className={styles.edit}>
              <SplitPane split="horizontal" defaultSize="75%">
                <div className={styles.inputContainer} ref={this._queryEditorContainer}>
                  <Box padding={4} paddingBottom={0}>
                    <Label muted>Query</Label>
                  </Box>
                  {/* <h3 className={styles.inputLabelQuery || 'query'}>Query</h3> */}
                  <CodeEditor
                    className={styles.queryEditor}
                    cursor={this.state.queryCursor}
                    fontSize={1}
                    language="javascript"
                    // onExecute={this.handleQueryExecution}
                    onChange={this.handleQueryChange}
                    onCursorChange={this.handleQueryCursorChange}
                    // onCursorChange={() => undefined}
                    // schema={this.props.schema}
                    value={this.state.query}
                  />
                </div>
                <Card className={styles.inputContainer} ref={this._paramsEditorContainer}>
                  <Box padding={4} paddingBottom={0}>
                    <Label muted>Params</Label>
                  </Box>
                  {/* <h3 className={styles.inputLabelQuery || 'query'}>Params</h3> */}
                  <CodeEditor
                    className={styles.paramsEditor}
                    cursor={this.state.paramsCursor}
                    language="json"
                    onChange={this.handleParamsChange}
                    onCursorChange={this.handleParamsCursorChange}
                    value={this.state.rawParams}
                  />
                  {/* <ParamsEditor
                    className={styles.paramsEditor}
                    classNameInvalid={styles.paramsEditorInvalid}
                    value={this.state.rawParams}
                    onExecute={this.handleQueryExecution}
                    onChange={this.handleParamsChange}
                  /> */}
                </Card>
              </SplitPane>
            </div>

            {/* Result JSON */}
            <div className={styles.resultContainer}>
              <h3 className={styles.inputLabelQuery || 'resultLabel'}>Result</h3>
              <div className={styles.result}>
                {queryInProgress && <DelayedSpinner />}
                {error && <QueryErrorDialog error={error} />}
                {hasResult && !hasEmptyResult && <ResultView data={result} />}
                {hasEmptyResult && (
                  <div className={styles.noResult}>
                    <NoResultsDialog query={executedQuery || ''} dataset={dataset} />
                  </div>
                )}
                {listenMutations && listenMutations.length > 0 && (
                  <ResultView data={listenMutations} />
                )}
              </div>
            </div>
          </SplitPane>
        </div>
      </Card>
    )
  }
}
