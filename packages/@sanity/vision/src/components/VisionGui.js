/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import SplitPane from 'react-split-pane'
import {PlayIcon, StopIcon, CopyIcon} from '@sanity/icons'
import isHotkey from 'is-hotkey'
import {Flex, Card, Stack, Box, Hotkeys, Select, Text, TextInput, Tooltip, Grid} from '@sanity/ui'
import studioClient from 'part:@sanity/base/client'
import {FormFieldValidationStatus} from '@sanity/base/components'
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
import {
  Root,
  Header,
  SplitpaneContainer,
  QueryCopyLink,
  InputBackgroundContainer,
  InputBackgroundContainerLeft,
  InputContainer,
  StyledLabel,
  ResultOuterContainer,
  ResultInnerContainer,
  ResultContainer,
  Result,
  ControlsContainer,
  ButtonFullWidth,
  TimingsFooter,
  TimingsCard,
  TimingsTextContainer,
  GlobalCodeMirrorStyle,
} from './VisionGui.styled'

/* eslint-disable import/no-unassigned-import, import/no-unresolved */
import 'codemirror/lib/codemirror.css?raw'
import 'codemirror/theme/material.css?raw'
import 'codemirror/addon/hint/show-hint.css?raw'

function nodeContains(node, other) {
  if (!node || !other) {
    return false
  }
  // eslint-disable-next-line no-bitwise
  return node === other || !!(node.compareDocumentPosition(other) & 16)
}
/* eslint-enable import/no-unassigned-import, import/no-unresolved */

const sanityUrl = /\.api\.sanity\.io\/(vx|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/
const isRunHotkey = (event) => isHotkey('ctrl+enter', event) || isHotkey('mod+enter', event)

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

    this._visionRoot = React.createRef()
    this._queryEditorContainer = React.createRef()
    this._paramsEditorContainer = React.createRef()

    this.client = studioClient.withConfig({apiVersion, dataset})

    this.subscribers = {}
    this.state = {
      paramValidationMarkers: [],
      validParams: true,
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
    this.handleListenerMutation = this.handleListenerMutation.bind(this)
    this.handleQueryExecution = this.handleQueryExecution.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleParamsChange = this.handleParamsChange.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  componentDidMount() {
    window.document.addEventListener('paste', this.handlePaste)
    window.document.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    this.cancelQuery()
    this.cancelListener()
    this.cancelEventListener()
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

  cancelEventListener() {
    window.removeEventListener('keydown', this.handleKeyDown)
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

  handleKeyDown(event) {
    const {validParams} = this.state
    const isWithinRoot =
      this._visionRoot.current && nodeContains(this._visionRoot.current, event.target)
    if (isRunHotkey(event) && isWithinRoot && validParams) {
      this.handleQueryExecution()
    }
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
      result: undefined,
      listenInProgress: !paramsError && Boolean(query),
      error: paramsError || undefined,
      // result: undefined,
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
    this.setState({url})

    const queryStart = Date.now()

    this.subscribers.query = this.client.observable
      .fetch(query, params, {filterResponse: false, tag: 'vision'})
      .subscribe({
        next: (res) => {
          this.setState({
            executedQuery: query,
            queryTime: res.ms,
            e2eTime: Date.now() - queryStart,
            result: res.result,
            queryInProgress: false,
            error: null,
          })
        },
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
    const {raw, parsed, valid, validationError} = data
    const paramValidationMarkers = valid
      ? []
      : [
          {
            type: 'validation',
            level: 'error',
            item: {
              message: validationError || 'Invalid JSON',
            },
          },
        ]

    this.setState({
      rawParams: raw,
      params: parsed,
      validParams: valid,
      paramValidationMarkers,
    })
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
      validParams,
      paramValidationMarkers,
    } = this.state
    const hasResult = !error && !queryInProgress && typeof result !== 'undefined'
    const hasEmptyResult = hasResult && Array.isArray(result) && result.length === 0

    // Note that because of react-json-inspector, we need at least one
    // addressable, non-generated class name. Therefore;
    // leave `sanity-vision` untouched!
    const visionClass = ['sanity-vision'].filter(Boolean).join(' ')

    return (
      <Root
        tone="default"
        className={visionClass}
        ref={this._visionRoot}
        display="flex"
        sizing="border"
        overflow="hidden"
      >
        <GlobalCodeMirrorStyle />
        <Header paddingX={3} paddingY={2}>
          <Grid columns={12}>
            {/* Dataset selector */}
            <Box padding={1} column={2}>
              <Stack>
                <Card paddingY={2}>
                  <StyledLabel>Dataset</StyledLabel>
                </Card>
                <Select value={dataset} onChange={this.handleChangeDataset}>
                  {datasets.map((ds) => (
                    <option key={ds.name}>{ds.name}</option>
                  ))}
                </Select>
              </Stack>
            </Box>

            {/* API version selector */}
            <Box padding={1} column={2}>
              <Stack>
                <Card paddingY={2}>
                  <StyledLabel>API version</StyledLabel>
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
              <Box padding={1} column={2}>
                <Stack>
                  <Card paddingY={2}>
                    <StyledLabel>Custom API version</StyledLabel>
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
              <Box padding={1} flex={1} column={customApiVersion ? 6 : 8}>
                <Stack>
                  <Card paddingY={2}>
                    <StyledLabel>
                      Query URL&nbsp;
                      <QueryCopyLink onClick={handleCopyUrl}>[copy]</QueryCopyLink>
                    </StyledLabel>
                  </Card>
                  <TextInput
                    readOnly
                    id="vision-query-url"
                    value={url}
                    iconRight={CopyIcon}
                    onClick={handleCopyUrl}
                  />
                </Stack>
              </Box>
            ) : (
              <Box flex={1} />
            )}
          </Grid>
        </Header>
        <SplitpaneContainer flex={1}>
          <SplitPane split="vertical" minSize={280} defaultSize={400} maxSize={-400}>
            <Box height="stretch" flex={1}>
              <SplitPane
                split="horizontal"
                defaultSize={'50%'}
                minSize={160}
                maxSize={-300}
                primary="second"
              >
                <InputContainer display="flex" ref={this._queryEditorContainer}>
                  <Card flex={1}>
                    <InputBackgroundContainerLeft>
                      <Flex marginLeft={3}>
                        <StyledLabel muted>Query</StyledLabel>
                      </Flex>
                    </InputBackgroundContainerLeft>
                    <QueryEditor
                      value={this.state.query}
                      onExecute={this.handleQueryExecution}
                      onChange={this.handleQueryChange}
                      schema={this.props.schema}
                    />
                  </Card>
                </InputContainer>
                <InputContainer display="flex" ref={this._paramsEditorContainer}>
                  <Card flex={1} tone={validParams ? 'default' : 'critical'}>
                    <InputBackgroundContainerLeft>
                      <Flex marginLeft={3}>
                        <StyledLabel muted>Params</StyledLabel>
                        {paramValidationMarkers.length > 0 && (
                          <Box marginLeft={2}>
                            <FormFieldValidationStatus
                              fontSize={1}
                              __unstable_markers={paramValidationMarkers}
                            />
                          </Box>
                        )}
                      </Flex>
                    </InputBackgroundContainerLeft>
                    <ParamsEditor
                      value={this.state.rawParams}
                      onExecute={this.handleQueryExecution}
                      onChange={this.handleParamsChange}
                    />
                  </Card>
                  {/* Controls (listen/run) */}
                  <ControlsContainer>
                    <Card padding={3} paddingX={3}>
                      <Tooltip
                        content={
                          <Card padding={2} radius={4}>
                            <Text size={1} muted>
                              Parameters are not valid JSON
                            </Text>
                          </Card>
                        }
                        placement="top"
                        disabled={validParams}
                        portal
                      >
                        <Flex justify="space-evenly">
                          <Card flex={1}>
                            <Tooltip
                              content={
                                <Card padding={2} radius={4}>
                                  <Hotkeys keys={['Ctrl', 'Enter']} />
                                </Card>
                              }
                              placement="top"
                              portal
                            >
                              <ButtonFullWidth
                                onClick={this.handleQueryExecution}
                                icon={PlayIcon}
                                loading={queryInProgress}
                                disabled={listenInProgress || !validParams}
                                tone="primary"
                                text="Fetch"
                              />
                            </Tooltip>
                          </Card>
                          <Card flex={1} marginLeft={3}>
                            <ButtonFullWidth
                              onClick={this.handleListenExecution}
                              type="button"
                              icon={listenInProgress ? StopIcon : PlayIcon}
                              text={listenInProgress ? 'Stop' : 'Listen'}
                              mode="ghost"
                              disabled={!validParams}
                              tone={listenInProgress ? 'positive' : 'default'}
                            />
                          </Card>
                        </Flex>
                      </Tooltip>
                    </Card>
                  </ControlsContainer>
                </InputContainer>
              </SplitPane>
            </Box>
            <ResultOuterContainer direction="column">
              <ResultInnerContainer flex={1}>
                <ResultContainer
                  flex={1}
                  overflow="hidden"
                  tone={error ? 'critical' : 'default'}
                  $isInvalid={error}
                >
                  <Result padding={3} paddingTop={5} overflow="auto" $isInvalid={error}>
                    <InputBackgroundContainer>
                      <Box marginLeft={3}>
                        <StyledLabel muted>Result</StyledLabel>
                      </Box>
                    </InputBackgroundContainer>
                    {queryInProgress && (
                      <Box marginTop={3}>
                        <DelayedSpinner />
                      </Box>
                    )}
                    {error && (
                      <Box>
                        <QueryErrorDialog error={error} />
                      </Box>
                    )}
                    {hasResult && !hasEmptyResult && <ResultView data={result} query={query} />}
                    {hasEmptyResult && (
                      <Box>
                        <NoResultsDialog query={executedQuery} dataset={dataset} />
                      </Box>
                    )}
                    {listenMutations && listenMutations.length > 0 && (
                      <ResultView data={listenMutations} />
                    )}
                  </Result>
                </ResultContainer>
              </ResultInnerContainer>
              {/* Execution time */}
              <TimingsFooter>
                <TimingsCard paddingX={4} paddingY={3} sizing="border">
                  <TimingsTextContainer align="center">
                    <Card>
                      <Text muted>
                        Execution: {typeof queryTime === 'number' ? `${queryTime}ms` : 'n/a'}
                      </Text>
                    </Card>
                    <Card marginLeft={4}>
                      <Text muted>
                        End-to-end: {typeof e2eTime === 'number' ? `${e2eTime}ms` : 'n/a'}
                      </Text>
                    </Card>
                  </TimingsTextContainer>
                </TimingsCard>
              </TimingsFooter>
            </ResultOuterContainer>
          </SplitPane>
        </SplitpaneContainer>
      </Root>
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

export default VisionGui
