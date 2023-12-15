/* eslint-disable complexity */
import React, {ChangeEvent, type RefObject} from 'react'
import SplitPane from '@rexxars/react-split-pane'
import type {ListenEvent, MutationEvent, SanityClient, ClientPerspective} from '@sanity/client'
import {PlayIcon, StopIcon, CopyIcon, ErrorOutlineIcon} from '@sanity/icons'
import isHotkey from 'is-hotkey'
import {
  Flex,
  Card,
  Stack,
  Box,
  Hotkeys,
  Select,
  Text,
  TextInput,
  Tooltip,
  Grid,
  Button,
  ToastContextValue,
  Inline,
} from '@sanity/ui'
import {TFunction} from 'sanity'
import {VisionCodeMirror} from '../codemirror/VisionCodeMirror'
import {getLocalStorage, LocalStorageish} from '../util/localStorage'
import {parseApiQueryString, ParsedApiQueryString} from '../util/parseApiQueryString'
import {validateApiVersion} from '../util/validateApiVersion'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {tryParseParams} from '../util/tryParseParams'
import {encodeQueryString} from '../util/encodeQueryString'
import {API_VERSIONS, DEFAULT_API_VERSION} from '../apiVersions'
import {PERSPECTIVES, DEFAULT_PERSPECTIVE, isPerspective} from '../perspectives'
import {ResizeObserver} from '../util/resizeObserver'
import type {VisionProps} from '../types'
import {DelayedSpinner} from './DelayedSpinner'
import {ParamsEditor, type ParamsEditorChangeEvent} from './ParamsEditor'
import {ResultView} from './ResultView'
import {QueryErrorDialog} from './QueryErrorDialog'
import {PerspectivePopover} from './PerspectivePopover'
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
} from './VisionGui.styled'

function nodeContains(node: Node, other: EventTarget | Node | null): boolean {
  if (!node || !other) {
    return false
  }

  // eslint-disable-next-line no-bitwise
  return node === other || !!(node.compareDocumentPosition(other as Node) & 16)
}

const sanityUrl =
  /\.(?:api|apicdn)\.sanity\.io\/(vX|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/
const isRunHotkey = (event: KeyboardEvent) =>
  isHotkey('ctrl+enter', event) || isHotkey('mod+enter', event)

interface PaneSizeOptions {
  defaultSize: number
  size?: number
  allowResize: boolean
  minSize: number
  maxSize: number
}

function narrowBreakpoint(): boolean {
  return typeof window !== 'undefined' && window.innerWidth > 600
}

function calculatePaneSizeOptions(rootHeight: number): PaneSizeOptions {
  return {
    defaultSize: rootHeight / (narrowBreakpoint() ? 2 : 1),
    size: rootHeight > 550 ? undefined : rootHeight * 0.4,
    allowResize: rootHeight > 550,
    minSize: Math.min(170, Math.max(170, rootHeight / 2)),
    maxSize: rootHeight > 650 ? rootHeight * 0.7 : rootHeight * 0.6,
  }
}

interface Subscription {
  unsubscribe: () => void
}

interface VisionGuiProps extends VisionProps {
  toast: ToastContextValue
  datasets: string[]
  t: TFunction<'vision', undefined>
}

interface VisionGuiState {
  // Selected options
  dataset: string
  apiVersion: string
  customApiVersion: string | false
  perspective: ClientPerspective

  // Selected options validation state
  isValidApiVersion: boolean

  // URL used to execute query/listener
  url?: string | undefined

  // Inputs
  query: string
  rawParams: string

  // Parsed input
  params: Record<string, unknown> | Error | undefined
  paramsError?: string | undefined
  hasValidParams: boolean

  // Query/listen result
  queryResult?: unknown | undefined
  listenMutations: MutationEvent[]
  error?: Error | undefined

  // Operation timings
  queryTime?: number | undefined
  e2eTime?: number | undefined

  // Operation state, used to trigger re-renders (spinners etc)
  queryInProgress: boolean
  listenInProgress: boolean

  // UI drawing state
  paneSizeOptions: PaneSizeOptions
}

export class VisionGui extends React.PureComponent<VisionGuiProps, VisionGuiState> {
  _visionRoot: RefObject<HTMLDivElement>
  _queryEditorContainer: RefObject<HTMLDivElement>
  _paramsEditorContainer: RefObject<HTMLDivElement>
  _operationUrlElement: RefObject<HTMLInputElement>
  _customApiVersionElement: RefObject<HTMLInputElement>
  _resizeListener: ResizeObserver | undefined
  _querySubscription: Subscription | undefined
  _listenSubscription: Subscription | undefined
  _client: SanityClient
  _localStorage: LocalStorageish

  constructor(props: VisionGuiProps) {
    super(props)

    const {client, datasets, config} = props
    this._localStorage = getLocalStorage(client.config().projectId || 'default')

    const lastQuery = this._localStorage.get('query', '')
    const lastParams = this._localStorage.get('params', '{\n  \n}')

    const defaultDataset = config.defaultDataset || client.config().dataset || datasets[0]
    const defaultApiVersion = prefixApiVersion(`${config.defaultApiVersion}`)
    const defaultPerspective = DEFAULT_PERSPECTIVE

    let dataset = this._localStorage.get('dataset', defaultDataset)
    let apiVersion = this._localStorage.get('apiVersion', defaultApiVersion)
    const customApiVersion = API_VERSIONS.includes(apiVersion) ? false : apiVersion
    let perspective = this._localStorage.get('perspective', defaultPerspective)

    if (!datasets.includes(dataset)) {
      dataset = datasets.includes(defaultDataset) ? defaultDataset : datasets[0]
    }

    if (!API_VERSIONS.includes(apiVersion)) {
      apiVersion = DEFAULT_API_VERSION
    }

    if (!PERSPECTIVES.includes(perspective)) {
      perspective = DEFAULT_PERSPECTIVE
    }

    this._visionRoot = React.createRef()
    this._operationUrlElement = React.createRef()
    this._queryEditorContainer = React.createRef()
    this._paramsEditorContainer = React.createRef()
    this._customApiVersionElement = React.createRef()

    this._client = props.client.withConfig({
      apiVersion: customApiVersion || apiVersion,
      dataset,
      perspective: perspective,
      allowReconfigure: true,
    })

    // Initial root height without header
    const bodyHeight =
      typeof window !== 'undefined' && typeof document !== 'undefined'
        ? document.body.getBoundingClientRect().height - 60
        : 0

    const params = lastParams ? tryParseParams(lastParams, this.props.t) : undefined

    this.state = {
      // Selected options
      dataset,
      apiVersion,
      customApiVersion,
      perspective,

      // Selected options validation state
      isValidApiVersion: customApiVersion ? validateApiVersion(customApiVersion) : false,

      // Inputs
      query: lastQuery,
      rawParams: lastParams,

      // Parsed input
      params,
      hasValidParams: !(params instanceof Error),

      // Query/listen results
      listenMutations: [],

      // Operation state
      queryInProgress: false,
      listenInProgress: false,

      // UI drawing state
      paneSizeOptions: calculatePaneSizeOptions(bodyHeight),
    }

    this.handleChangeDataset = this.handleChangeDataset.bind(this)
    this.handleChangeApiVersion = this.handleChangeApiVersion.bind(this)
    this.handleCustomApiVersionChange = this.handleCustomApiVersionChange.bind(this)
    this.handleChangePerspective = this.handleChangePerspective.bind(this)
    this.handleListenExecution = this.handleListenExecution.bind(this)
    this.handleListenerEvent = this.handleListenerEvent.bind(this)
    this.handleQueryExecution = this.handleQueryExecution.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleParamsChange = this.handleParamsChange.bind(this)
    this.handleCopyUrl = this.handleCopyUrl.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleResize = this.handleResize.bind(this)
  }

  componentDidMount() {
    window.document.addEventListener('paste', this.handlePaste)
    window.document.addEventListener('keydown', this.handleKeyDown)

    this.handleResizeListen()
  }

  componentWillUnmount() {
    this.cancelQuery()
    this.cancelListener()
    this.cancelEventListener()
    this.cancelResizeListener()
  }

  handleResizeListen() {
    if (!this._visionRoot.current) {
      return
    }

    this._resizeListener = new ResizeObserver(this.handleResize)
    this._resizeListener.observe(this._visionRoot.current)
  }

  handleResize(entries: ResizeObserverEntry[]) {
    const entry = entries?.[0]

    this.setState((prevState) => ({
      ...prevState,
      paneSizeOptions: calculatePaneSizeOptions(entry.contentRect.height),
    }))
  }

  cancelResizeListener() {
    if (this._resizeListener) {
      this._resizeListener.disconnect()
    }
  }

  handlePaste(evt: ClipboardEvent) {
    if (!evt.clipboardData) {
      return
    }

    const data = evt.clipboardData.getData('text/plain')
    const match = data.match(sanityUrl)
    if (!match) {
      return
    }

    const [, usedApiVersion, usedDataset, urlQuery] = match
    let parts: ParsedApiQueryString

    try {
      const qs = new URLSearchParams(urlQuery)
      parts = parseApiQueryString(qs)
    } catch (err) {
      console.warn('Error while trying to parse API URL: ', err.message) // eslint-disable-line no-console
      return // Give up on error
    }

    let apiVersion: string | undefined
    let customApiVersion: string | false | undefined

    if (validateApiVersion(usedApiVersion)) {
      if (API_VERSIONS.includes(usedApiVersion)) {
        apiVersion = usedApiVersion
        customApiVersion = false
      } else {
        customApiVersion = usedApiVersion
      }
    }

    const perspective = PERSPECTIVES.includes(parts.options.perspective as ClientPerspective)
      ? (parts.options.perspective as ClientPerspective)
      : undefined

    evt.preventDefault()
    this.setState(
      (prevState) => ({
        dataset: this.props.datasets.includes(usedDataset) ? usedDataset : prevState.dataset,
        query: parts.query,
        params: parts.params,
        rawParams: JSON.stringify(parts.params, null, 2),
        apiVersion: typeof apiVersion === 'undefined' ? prevState.apiVersion : apiVersion,
        customApiVersion:
          typeof customApiVersion === 'undefined' ? prevState.customApiVersion : customApiVersion,
        perspective: typeof perspective === 'undefined' ? prevState.perspective : perspective,
      }),
      () => {
        this._localStorage.merge({
          query: this.state.query,
          params: this.state.params,
          dataset: this.state.dataset,
          apiVersion: customApiVersion || apiVersion,
          perspective: this.state.perspective,
        })
        this._client.config({
          dataset: this.state.dataset,
          apiVersion: customApiVersion || apiVersion,
          perspective: this.state.perspective,
        })
        this.handleQueryExecution()
        this.props.toast.push({
          closable: true,
          id: 'vision-paste',
          status: 'info',
          title: 'Parsed URL to query',
        })
      },
    )
  }

  cancelQuery() {
    if (!this._querySubscription) {
      return
    }

    this._querySubscription.unsubscribe()
    this._querySubscription = undefined
  }

  cancelListener() {
    if (!this._listenSubscription) {
      return
    }

    this._listenSubscription.unsubscribe()
    this._listenSubscription = undefined
  }

  cancelEventListener() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  handleChangeDataset(evt: ChangeEvent<HTMLSelectElement>) {
    const dataset = evt.target.value
    this._localStorage.set('dataset', dataset)
    this.setState({dataset})
    this._client.config({dataset})
    this.handleQueryExecution()
  }

  handleChangeApiVersion(evt: ChangeEvent<HTMLSelectElement>) {
    const apiVersion = evt.target.value
    if (apiVersion?.toLowerCase() === 'other') {
      this.setState({customApiVersion: 'v'}, () => {
        this._customApiVersionElement.current?.focus()
      })
      return
    }

    this.setState({apiVersion, customApiVersion: false}, () => {
      this._localStorage.set('apiVersion', this.state.apiVersion)
      this._client.config({
        apiVersion: this.state.apiVersion,
      })
      this.handleQueryExecution()
    })
  }

  handleCustomApiVersionChange(evt: ChangeEvent<HTMLInputElement>) {
    const customApiVersion = evt.target.value || ''
    const isValidApiVersion = validateApiVersion(customApiVersion)

    this.setState(
      (prevState) => ({
        apiVersion: isValidApiVersion ? customApiVersion : prevState.apiVersion,
        customApiVersion: customApiVersion || 'v',
        isValidApiVersion,
      }),
      () => {
        if (!this.state.isValidApiVersion || typeof this.state.customApiVersion !== 'string') {
          return
        }

        this._localStorage.set('apiVersion', this.state.customApiVersion)
        this._client.config({apiVersion: this.state.customApiVersion})
      },
    )
  }

  handleChangePerspective(evt: ChangeEvent<HTMLSelectElement>) {
    const perspective = evt.target.value
    if (!isPerspective(perspective)) {
      return
    }

    this.setState({perspective}, () => {
      this._localStorage.set('perspective', this.state.perspective)
      this._client.config({
        perspective: this.state.perspective,
      })
      this.handleQueryExecution()
    })
  }

  handleListenerEvent(evt: ListenEvent<any>) {
    if (evt.type !== 'mutation') {
      this.props.toast.push({
        closable: true,
        id: 'vision-listen',
        status: 'success',
        title: 'Listening for mutations…',
      })
      return
    }

    this.setState(({listenMutations}) => ({
      listenMutations:
        listenMutations.length === 50
          ? [evt, ...listenMutations.slice(0, 49)]
          : [evt, ...listenMutations],
    }))
  }

  handleKeyDown(event: KeyboardEvent) {
    const {hasValidParams} = this.state
    const isWithinRoot =
      this._visionRoot.current && nodeContains(this._visionRoot.current, event.target)
    if (isRunHotkey(event) && isWithinRoot && hasValidParams) {
      this.handleQueryExecution()
      event.preventDefault()
      event.stopPropagation()
    }
  }

  ensureSelectedApiVersion() {
    const {apiVersion, customApiVersion} = this.state
    const wantedApiVersion = customApiVersion || apiVersion
    if (this._client.config().apiVersion !== wantedApiVersion) {
      this._client.config({apiVersion: wantedApiVersion})
    }
  }

  handleListenExecution() {
    const {query, params, rawParams, listenInProgress} = this.state
    if (listenInProgress) {
      this.cancelListener()
      this.setState({listenInProgress: false})
      return
    }

    this.ensureSelectedApiVersion()

    const paramsError = params instanceof Error ? params : undefined
    const encodeParams = params instanceof Error ? {} : params || {}
    const url = this._client.getDataUrl('listen', encodeQueryString(query, encodeParams, {}))

    const shouldExecute = !paramsError && query.trim().length > 0

    this._localStorage.set('query', query)
    this._localStorage.set('params', rawParams)

    this.cancelQuery()

    this.setState({
      url,
      listenMutations: [],
      queryInProgress: false,
      queryResult: undefined,
      listenInProgress: shouldExecute,
      error: paramsError,
      queryTime: undefined,
      e2eTime: undefined,
    })

    if (!shouldExecute) {
      return
    }

    this._listenSubscription = this._client
      .listen(query, params, {events: ['mutation', 'welcome']})
      .subscribe({
        next: this.handleListenerEvent,
        error: (error) =>
          this.setState({
            error,
            query,
            listenInProgress: false,
          }),
      })
  }

  handleQueryExecution() {
    const {query, params, rawParams, queryInProgress} = this.state

    if (queryInProgress) {
      this.cancelQuery()
      this.cancelListener()
      this.setState({queryInProgress: false})
      return true
    }

    const paramsError = params instanceof Error && params
    this._localStorage.set('query', query)
    this._localStorage.set('params', rawParams)

    this.cancelListener()

    this.setState({
      queryInProgress: !paramsError && Boolean(query),
      listenInProgress: false,
      listenMutations: [],
      error: paramsError || undefined,
      queryResult: undefined,
      queryTime: undefined,
      e2eTime: undefined,
    })

    if (!query || paramsError) {
      return true
    }

    this.ensureSelectedApiVersion()

    const urlQueryOpts: Record<string, string> = {}
    if (this.state.perspective !== 'raw') {
      urlQueryOpts.perspective = this.state.perspective
    }

    const url = this._client.getUrl(
      this._client.getDataUrl('query', encodeQueryString(query, params, urlQueryOpts)),
    )
    this.setState({url})

    const queryStart = Date.now()

    this._querySubscription = this._client.observable
      .fetch(query, params, {filterResponse: false, tag: 'vision'})
      .subscribe({
        next: (res) =>
          this.setState({
            queryTime: res.ms,
            e2eTime: Date.now() - queryStart,
            queryResult: res.result,
            queryInProgress: false,
            error: undefined,
          }),
        error: (error) =>
          this.setState({
            error,
            query,
            queryInProgress: false,
          }),
      })

    return true
  }

  handleQueryChange(query: string) {
    this.setState({query})
  }

  handleParamsChange({raw, parsed, valid, error}: ParamsEditorChangeEvent) {
    this.setState(
      {
        rawParams: raw,
        params: parsed,
        hasValidParams: valid,
        paramsError: error,
      },
      () => this._localStorage.set('params', raw),
    )
  }

  handleCopyUrl() {
    const el = this._operationUrlElement.current
    if (!el) {
      return
    }

    try {
      el.select()
      document.execCommand('copy')
      this.props.toast.push({
        closable: true,
        title: 'Copied to clipboard',
        status: 'info',
        id: 'vision-copy',
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unable to copy to clipboard :(')
    }
  }

  render() {
    const {datasets, t} = this.props
    const {
      error,
      queryResult,
      url,
      queryInProgress,
      listenInProgress,
      paneSizeOptions,
      queryTime,
      e2eTime,
      listenMutations,
      apiVersion,
      dataset,
      customApiVersion,
      isValidApiVersion,
      hasValidParams,
      paramsError,
      perspective,
    } = this.state
    const hasResult = !error && !queryInProgress && typeof queryResult !== 'undefined'

    return (
      <Root
        direction="column"
        height="fill"
        ref={this._visionRoot}
        sizing="border"
        overflow="hidden"
      >
        <Header paddingX={3} paddingY={2}>
          <Grid columns={[1, 4, 8, 12]}>
            {/* Dataset selector */}
            <Box padding={1} column={2}>
              <Stack>
                <Card paddingTop={2} paddingBottom={3}>
                  <StyledLabel>{t('settings.dataset-label')}</StyledLabel>
                </Card>
                <Select value={dataset} onChange={this.handleChangeDataset}>
                  {datasets.map((ds) => (
                    <option key={ds}>{ds}</option>
                  ))}
                </Select>
              </Stack>
            </Box>

            {/* API version selector */}
            <Box padding={1} column={2}>
              <Stack>
                <Card paddingTop={2} paddingBottom={3}>
                  <StyledLabel>{t('settings.api-version-label')}</StyledLabel>
                </Card>
                <Select
                  value={
                    customApiVersion === false ? apiVersion : t('settings.other-api-version-label')
                  }
                  onChange={this.handleChangeApiVersion}
                >
                  {API_VERSIONS.map((version) => (
                    <option key={version}>{version}</option>
                  ))}
                  <option key="other" value={t('settings.other-api-version-label')}>
                    {t('settings.other-api-version-label')}
                  </option>
                </Select>
              </Stack>
            </Box>

            {/* Custom API version input */}
            {customApiVersion !== false && (
              <Box padding={1} column={2}>
                <Stack>
                  <Card paddingTop={2} paddingBottom={3}>
                    <StyledLabel textOverflow="ellipsis">
                      {t('settings.custom-api-version-label')}
                    </StyledLabel>
                  </Card>

                  <TextInput
                    ref={this._customApiVersionElement}
                    value={customApiVersion}
                    onChange={this.handleCustomApiVersionChange}
                    customValidity={
                      isValidApiVersion ? undefined : t('settings.error.invalid-api-version')
                    }
                    maxLength={11}
                  />
                </Stack>
              </Box>
            )}

            {/* Perspective selector */}
            <Box padding={1} column={2}>
              <Stack>
                <Card paddingBottom={1}>
                  <Inline space={1}>
                    <Box>
                      <StyledLabel>{t('settings.perspective-label')}</StyledLabel>
                    </Box>

                    <Box>
                      <PerspectivePopover />
                    </Box>
                  </Inline>
                </Card>

                <Select value={perspective} onChange={this.handleChangePerspective}>
                  {PERSPECTIVES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </Stack>
            </Box>

            {/* Query URL (for copying) */}
            {typeof url === 'string' ? (
              <Box padding={1} flex={1} column={customApiVersion === false ? 6 : 4}>
                <Stack>
                  <Card paddingTop={2} paddingBottom={3}>
                    <StyledLabel>
                      {t('query.url')}&nbsp;
                      <QueryCopyLink onClick={this.handleCopyUrl}>
                        [{t('action.copy-url-to-clipboard')}]
                      </QueryCopyLink>
                    </StyledLabel>
                  </Card>
                  <Flex flex={1} gap={1}>
                    <Box flex={1}>
                      <TextInput readOnly type="url" ref={this._operationUrlElement} value={url} />
                    </Box>
                    <Tooltip
                      content={
                        <Box padding={2}>
                          <Text>{t('action.copy-url-to-clipboard')}</Text>
                        </Box>
                      }
                    >
                      <Button
                        aria-label={t('action.copy-url-to-clipboard')}
                        type="button"
                        mode="ghost"
                        icon={CopyIcon}
                        onClick={this.handleCopyUrl}
                      />
                    </Tooltip>
                  </Flex>
                </Stack>
              </Box>
            ) : (
              <Box flex={1} />
            )}
          </Grid>
        </Header>
        <SplitpaneContainer flex="auto">
          {/* @ts-expect-error: https://github.com/tomkp/react-split-pane/pull/819 */}
          <SplitPane
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
            split={narrowBreakpoint() ? 'vertical' : 'horizontal'}
            minSize={280}
            defaultSize={400}
            maxSize={-400}
          >
            <Box height="stretch" flex={1}>
              {/*
                  The way react-split-pane handles the sizes is kind of finicky and not clear. What the props above does is:
                  - It sets the initial size of the panes to 1/2 of the total available height of the container
                  - Sets the minimum size of a pane whatever is bigger of 1/2 of the total available height of the container, or 170px
                  - The max size is set to either 60% or 70% of the available space, depending on if the container height is above 650px
                  - Disables resizing when total height is below 500, since it becomes really cumbersome to work with the panes then
                  - The "primary" prop (https://github.com/tomkp/react-split-pane#primary) tells the second pane to shrink or grow by the available space
                  - Disables resize if the container height is less then 500px
                  This should ensure that we mostly avoid a pane to take up all the room, and for the controls to not be eaten up by the pane
                */}
              {/* @ts-expect-error: https://github.com/tomkp/react-split-pane/pull/819 */}
              <SplitPane
                className="sidebarPanes"
                split={'horizontal'}
                defaultSize={
                  narrowBreakpoint() ? paneSizeOptions.defaultSize : paneSizeOptions.minSize
                }
                size={paneSizeOptions.size}
                allowResize={paneSizeOptions.allowResize}
                minSize={narrowBreakpoint() ? paneSizeOptions.minSize : 100}
                maxSize={paneSizeOptions.maxSize}
                primary="first"
              >
                <InputContainer display="flex" ref={this._queryEditorContainer}>
                  <Box flex={1}>
                    <InputBackgroundContainerLeft>
                      <Flex>
                        <StyledLabel muted>{t('query.label')}</StyledLabel>
                      </Flex>
                    </InputBackgroundContainerLeft>
                    <VisionCodeMirror value={this.state.query} onChange={this.handleQueryChange} />
                  </Box>
                </InputContainer>
                <InputContainer display="flex" ref={this._paramsEditorContainer}>
                  <Card flex={1} tone={hasValidParams ? 'default' : 'critical'}>
                    <InputBackgroundContainerLeft>
                      <Flex>
                        <StyledLabel muted>{t('params.label')}</StyledLabel>
                        {paramsError && (
                          <Tooltip
                            placement="top-end"
                            portal
                            content={
                              <Box padding={2}>
                                <Text>{paramsError}</Text>
                              </Box>
                            }
                          >
                            <Box padding={1} marginX={2}>
                              <Text>
                                <ErrorOutlineIcon />
                              </Text>
                            </Box>
                          </Tooltip>
                        )}
                      </Flex>
                    </InputBackgroundContainerLeft>
                    <ParamsEditor value={this.state.rawParams} onChange={this.handleParamsChange} />
                  </Card>
                  {/* Controls (listen/run) */}
                  <ControlsContainer>
                    <Card padding={3} paddingX={3}>
                      <Tooltip
                        content={
                          <Card padding={2} radius={4}>
                            <Text size={1} muted>
                              {t('params.error.params-invalid-json')}
                            </Text>
                          </Card>
                        }
                        placement="top"
                        disabled={hasValidParams}
                        portal
                      >
                        <Flex justify="space-evenly">
                          <Box flex={1}>
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
                                type="button"
                                icon={queryInProgress ? StopIcon : PlayIcon}
                                disabled={listenInProgress || !hasValidParams}
                                tone={queryInProgress ? 'positive' : 'primary'}
                                text={
                                  queryInProgress
                                    ? t('action.query-cancel')
                                    : t('action.query-execute')
                                }
                              />
                            </Tooltip>
                          </Box>
                          <Box flex={1} marginLeft={3}>
                            <ButtonFullWidth
                              onClick={this.handleListenExecution}
                              type="button"
                              icon={listenInProgress ? StopIcon : PlayIcon}
                              text={
                                listenInProgress
                                  ? t('action.listen-cancel')
                                  : t('action.listen-execute')
                              }
                              mode="ghost"
                              disabled={!hasValidParams}
                              tone={listenInProgress ? 'positive' : 'default'}
                            />
                          </Box>
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
                  $isInvalid={Boolean(error)}
                >
                  <Result overflow="auto">
                    <InputBackgroundContainer>
                      <Box marginLeft={3}>
                        <StyledLabel muted>{t('result.label')}</StyledLabel>
                      </Box>
                    </InputBackgroundContainer>
                    <Box padding={3} paddingTop={5}>
                      {(queryInProgress || (listenInProgress && listenMutations.length === 0)) && (
                        <Box marginTop={3}>
                          <DelayedSpinner />
                        </Box>
                      )}
                      {error && <QueryErrorDialog error={error} />}
                      {hasResult && <ResultView data={queryResult} />}
                      {listenInProgress && listenMutations.length > 0 && (
                        <ResultView data={listenMutations} />
                      )}
                    </Box>
                  </Result>
                </ResultContainer>
              </ResultInnerContainer>
              {/* Execution time */}
              <TimingsFooter>
                <TimingsCard paddingX={4} paddingY={3} sizing="border">
                  <TimingsTextContainer align="center">
                    <Box>
                      <Text muted>
                        {t('result.execution-time-label')}:{' '}
                        {typeof queryTime === 'number'
                          ? `${queryTime}ms`
                          : t('result.timing-not-applicable')}
                      </Text>
                    </Box>
                    <Box marginLeft={4}>
                      <Text muted>
                        {t('result.end-to-end-time-label')}:{' '}
                        {typeof e2eTime === 'number'
                          ? `${e2eTime}ms`
                          : t('result.timing-not-applicable')}
                      </Text>
                    </Box>
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
