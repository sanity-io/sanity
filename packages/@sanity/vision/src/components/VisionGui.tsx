/* eslint-disable react/jsx-handler-names */
/* eslint-disable complexity */
import {type ListenEvent, type MutationEvent, type SanityClient} from '@sanity/client'
import {type ToastContextValue} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {type ChangeEvent, createRef, PureComponent, type RefObject} from 'react'
import {type TFunction} from 'sanity'

import {API_VERSIONS, DEFAULT_API_VERSION} from '../apiVersions'
import {
  getActivePerspective,
  hasPinnedPerspective,
  hasPinnedPerspectiveChanged,
  isSupportedPerspective,
  isVirtualPerspective,
  type SupportedPerspective,
} from '../perspectives'
import {type VisionProps} from '../types'
import {encodeQueryString} from '../util/encodeQueryString'
import {getLocalStorage, type LocalStorageish} from '../util/localStorage'
import {parseApiQueryString, type ParsedApiQueryString} from '../util/parseApiQueryString'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {ResizeObserver} from '../util/resizeObserver'
import {tryParseParams} from '../util/tryParseParams'
import {validateApiVersion} from '../util/validateApiVersion'
import {type ParamsEditorChangeEvent} from './ParamsEditor'
import {VisionGuiComponent} from './VisionGuiComponent'

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

export interface PaneSizeOptions {
  defaultSize: number
  size?: number
  allowResize: boolean
  minSize: number
  maxSize: number
}

function narrowBreakpoint(): boolean {
  return typeof window !== 'undefined' && window.innerWidth > 600
}

export function calculatePaneSizeOptions(rootHeight: number): PaneSizeOptions {
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
  perspective: SupportedPerspective | undefined

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

export class VisionGui extends PureComponent<VisionGuiProps, VisionGuiState> {
  _visionRoot: RefObject<HTMLDivElement | null>
  _queryEditorContainer: RefObject<HTMLDivElement | null>
  _paramsEditorContainer: RefObject<HTMLDivElement | null>
  _customApiVersionElement: RefObject<HTMLInputElement | null>
  _resizeListener: ResizeObserver | undefined
  _querySubscription: Subscription | undefined
  _listenSubscription: Subscription | undefined
  _client: SanityClient
  _localStorage: LocalStorageish
  _editorQueryRef: RefObject<VisionCodeMirrorHandle | null>
  _editorParamsRef: RefObject<VisionCodeMirrorHandle | null>

  constructor(props: VisionGuiProps) {
    super(props)

    const {client, datasets, config} = props
    this._localStorage = getLocalStorage(client.config().projectId || 'default')

    const defaultDataset = config.defaultDataset || client.config().dataset || datasets[0]
    const defaultApiVersion = prefixApiVersion(`${config.defaultApiVersion}`)

    let dataset = this._localStorage.get('dataset', defaultDataset)
    let apiVersion = this._localStorage.get('apiVersion', defaultApiVersion)
    let lastQuery = this._localStorage.get('query', '')
    let lastParams = this._localStorage.get('params', '{\n  \n}')
    const customApiVersion = API_VERSIONS.includes(apiVersion) ? false : apiVersion
    const perspective = this._localStorage.get<SupportedPerspective | undefined>(
      'perspective',
      undefined,
    )

    if (!datasets.includes(dataset)) {
      dataset = datasets.includes(defaultDataset) ? defaultDataset : datasets[0]
    }

    if (!API_VERSIONS.includes(apiVersion)) {
      apiVersion = DEFAULT_API_VERSION
    }

    if (typeof lastQuery !== 'string') {
      lastQuery = ''
    }

    if (typeof lastParams !== 'string') {
      lastParams = '{\n  \n}'
    }

    this._visionRoot = createRef()
    this._queryEditorContainer = createRef()
    this._paramsEditorContainer = createRef()
    this._customApiVersionElement = createRef()
    this._editorQueryRef = createRef()
    this._editorParamsRef = createRef()

    this._client = props.client.withConfig({
      apiVersion: customApiVersion || apiVersion,
      dataset,
      perspective: getActivePerspective({
        visionPerspective: perspective,
        pinnedPerspective: this.props.pinnedPerspective,
      }),
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
    this.handlePaste = this.handlePaste.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.setPerspective = this.setPerspective.bind(this)
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

  componentDidUpdate(prevProps: Readonly<VisionGuiProps>): void {
    if (hasPinnedPerspectiveChanged(prevProps.pinnedPerspective, this.props.pinnedPerspective)) {
      if (hasPinnedPerspective(this.props.pinnedPerspective)) {
        this.setPerspective('pinnedRelease')
      } else {
        this.setPerspective(undefined)
      }
    }
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

    const perspective =
      isSupportedPerspective(parts.options.perspective) &&
      !isVirtualPerspective(parts.options.perspective)
        ? parts.options.perspective
        : undefined

    if (
      perspective &&
      (!isSupportedPerspective(parts.options.perspective) ||
        isVirtualPerspective(parts.options.perspective))
    ) {
      this.props.toast.push({
        closable: true,
        id: 'vision-paste-unsupported-perspective',
        status: 'warning',
        title: 'Perspective in pasted url is currently not supported. Falling back to "raw"',
      })
    }

    evt.preventDefault()

    const query = parts.query
    const rawParams = JSON.stringify(parts.params, null, 2)
    this._editorQueryRef.current?.resetEditorContent(query)
    this._editorParamsRef.current?.resetEditorContent(rawParams)
    this.setState(
      (prevState) => ({
        dataset: this.props.datasets.includes(usedDataset) ? usedDataset : prevState.dataset,
        query,
        params: parts.params,
        rawParams,
        apiVersion: typeof apiVersion === 'undefined' ? prevState.apiVersion : apiVersion,
        customApiVersion:
          typeof customApiVersion === 'undefined' ? prevState.customApiVersion : customApiVersion,
        perspective: typeof perspective === 'undefined' ? prevState.perspective : perspective,
      }),
      () => {
        this._localStorage.merge({
          query: this.state.query,
          params: this.state.rawParams,
          dataset: this.state.dataset,
          apiVersion: customApiVersion || apiVersion,
          perspective: this.state.perspective,
        })
        this._client.config({
          dataset: this.state.dataset,
          apiVersion: customApiVersion || apiVersion,
          perspective: getActivePerspective({
            visionPerspective: this.state.perspective,
            pinnedPerspective: this.props.pinnedPerspective,
          }),
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
    this.setPerspective(perspective === 'default' ? undefined : perspective)
  }

  setPerspective(perspective: string | undefined): void {
    if (perspective !== undefined && !isSupportedPerspective(perspective)) {
      return
    }

    this.setState({perspective}, () => {
      this._localStorage.set('perspective', this.state.perspective)
      this._client.config({
        perspective: getActivePerspective({
          visionPerspective: this.state.perspective,
          pinnedPerspective: this.props.pinnedPerspective,
        }),
      })
      this.handleQueryExecution()
    })
  }

  handleListenerEvent(evt: ListenEvent<any>) {
    if (evt.type !== 'mutation') {
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
      .listen(query, params, {events: ['mutation', 'welcome'], includeAllVersions: true})
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

    const urlQueryOpts: Record<string, string | string[]> = {}
    if (this.state.perspective) {
      urlQueryOpts.perspective =
        getActivePerspective({
          visionPerspective: this.state.perspective,
          pinnedPerspective: this.props.pinnedPerspective,
        }) ?? []
    }

    const url = this._client.getUrl(
      this._client.getDataUrl('query', encodeQueryString(query, params, urlQueryOpts)),
    )
    this.setState({url})

    const queryStart = Date.now()

    this._querySubscription = this._client.observable
      .fetch(query, params, {filterResponse: false, tag: 'vision'})
      .subscribe({
        next: (res) => {
          this.setState({
            queryTime: res.ms,
            e2eTime: Date.now() - queryStart,
            queryResult: res.result,
            queryInProgress: false,
            error: undefined,
          })
        },
        error: (error) => {
          this.setState({
            error,
            query,
            queryInProgress: false,
          })
        },
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

  render() {
    const {datasets} = this.props
    const {
      apiVersion,
      customApiVersion,
      dataset,
      e2eTime,
      error,
      hasValidParams,
      isValidApiVersion,
      listenInProgress,
      listenMutations,
      paneSizeOptions,
      paramsError,
      perspective,
      query,
      queryInProgress,
      queryResult,
      queryTime,
      rawParams,
      url,
    } = this.state

    return (
      <VisionGuiComponent
        apiVersion={apiVersion}
        customApiVersion={customApiVersion}
        customApiVersionElementRef={this._customApiVersionElement}
        dataset={dataset}
        datasets={datasets}
        error={error}
        e2eTime={e2eTime}
        hasValidParams={hasValidParams}
        isValidApiVersion={isValidApiVersion}
        pinnedPerspective={this.props.pinnedPerspective}
        url={url}
        perspective={perspective}
        query={query}
        queryInProgress={queryInProgress}
        queryResult={queryResult}
        queryTime={queryTime}
        rawParams={rawParams}
        visionRootRef={this._visionRoot}
        queryEditorContainerRef={this._queryEditorContainer}
        paramsEditorContainerRef={this._paramsEditorContainer}
        handleQueryChange={this.handleQueryChange}
        handleParamsChange={this.handleParamsChange}
        handleQueryExecution={this.handleQueryExecution}
        handleListenExecution={this.handleListenExecution}
        handleChangeApiVersion={this.handleChangeApiVersion}
        handleChangeDataset={this.handleChangeDataset}
        handleChangePerspective={this.handleChangePerspective}
        handleCustomApiVersionChange={this.handleCustomApiVersionChange}
        listenInProgress={listenInProgress}
        listenMutations={listenMutations}
        narrowBreakpoint={narrowBreakpoint()}
        paneSizeOptions={paneSizeOptions}
        paramsError={paramsError}
      />
    )
  }
}
