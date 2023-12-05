/* eslint-disable max-statements */
/* eslint-disable complexity */
import React, {ChangeEvent, useRef, useCallback, useState, useEffect, useMemo} from 'react'
import SplitPane from '@rexxars/react-split-pane'
import type {ListenEvent, MutationEvent, ClientPerspective} from '@sanity/client'
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
import {useTranslation} from 'sanity'
import {VisionCodeMirror} from '../codemirror/VisionCodeMirror'
import {getLocalStorage} from '../util/localStorage'
import {parseApiQueryString, ParsedApiQueryString} from '../util/parseApiQueryString'
import {validateApiVersion} from '../util/validateApiVersion'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {tryParseParams} from '../util/tryParseParams'
import {encodeQueryString} from '../util/encodeQueryString'
import {API_VERSIONS, DEFAULT_API_VERSION} from '../apiVersions'
import {PERSPECTIVES, DEFAULT_PERSPECTIVE, isPerspective} from '../perspectives'
import {ResizeObserver} from '../util/resizeObserver'
import type {VisionProps} from '../types'
import {visionLocaleNamespace} from '../i18n'
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
}

export function VisionGui(props: VisionGuiProps) {
  const {client, datasets, config, toast} = props

  const {t} = useTranslation(visionLocaleNamespace)

  const _visionRoot = useRef<HTMLDivElement>(null)
  const _operationUrlElement = useRef<HTMLInputElement>(null)
  const _queryEditorContainer = useRef<HTMLDivElement>(null)
  const _paramsEditorContainer = useRef<HTMLDivElement>(null)
  const _customApiVersionElement = useRef<HTMLInputElement>(null)

  const defaultDataset = useMemo(
    () => config.defaultDataset || client.config().dataset || datasets[0],
    [client, config.defaultDataset, datasets],
  )
  const defaultApiVersion = useMemo(
    () => prefixApiVersion(`${config.defaultApiVersion}`),
    [config.defaultApiVersion],
  )
  const defaultPerspective = DEFAULT_PERSPECTIVE
  const _localStorage = useMemo(
    () => getLocalStorage(client.config().projectId || 'default'),
    [client],
  )

  // Initial root height without header
  const bodyHeight = useMemo(
    () =>
      typeof window !== 'undefined' && typeof document !== 'undefined'
        ? document.body.getBoundingClientRect().height - 60
        : 0,
    [],
  )

  // Selected options
  const [dataset, setDataset] = useState(() => _localStorage.get('dataset', defaultDataset))
  const [apiVersion, setApiVersion] = useState(() =>
    _localStorage.get('apiVersion', defaultApiVersion),
  )
  const [perspective, setPerspective] = useState<ClientPerspective>(() =>
    _localStorage.get('perspective', defaultPerspective),
  )
  const [customApiVersion, setCustomApiVersion] = useState<string | false>(() =>
    API_VERSIONS.includes(apiVersion) ? false : apiVersion,
  )

  // Selected options validation state
  const [isValidApiVersion, setIsValidApiVersion] = useState<boolean>(() =>
    customApiVersion ? validateApiVersion(customApiVersion) : false,
  )

  // URL used to execute query/listener
  const [url, setUrl] = useState<string | undefined>()

  // Inputs
  const [query, setQuery] = useState<string>(() => _localStorage.get('query', ''))
  const [rawParams, setRawParams] = useState<string>(() => _localStorage.get('params', '{\n  \n}'))

  // Parsed input
  const [params, setParams] = useState<Record<string, unknown> | Error | undefined>(() =>
    rawParams ? tryParseParams(rawParams, t) : undefined,
  )
  const [paramsError, setParamsError] = useState<string | undefined>()
  const [hasValidParams, setHasValidParams] = useState<boolean>()

  // Query/listen result
  const [queryResult, setQueryResult] = useState<unknown | undefined>()
  const [listenMutations, setListenMutations] = useState<MutationEvent[]>([])
  const [error, setError] = useState<Error | undefined>()

  // Operation timings
  const [queryTime, setQueryTime] = useState<number | undefined>()
  const [e2eTime, setE2eTime] = useState<number | undefined>()

  // Operation state, used to trigger re-renders (spinners etc)
  const [queryInProgress, setQueryInProgress] = useState<boolean>(false)
  const [listenInProgress, setListenInProgress] = useState<boolean>(false)

  // UI drawing state
  const [paneSizeOptions, setPaneSizeOptions] = useState<PaneSizeOptions>(() =>
    calculatePaneSizeOptions(bodyHeight),
  )

  const hasResult = !error && !queryInProgress && typeof queryResult !== 'undefined'

  const _client = useMemo(() => {
    return client.withConfig({
      apiVersion:
        customApiVersion || API_VERSIONS.includes(apiVersion) ? apiVersion : DEFAULT_API_VERSION,
      dataset: dataset.includes(dataset) ? dataset : datasets[0],
      perspective: PERSPECTIVES.includes(perspective) ? perspective : DEFAULT_PERSPECTIVE,
      allowReconfigure: true,
    })
  }, [apiVersion, client, customApiVersion, dataset, datasets, perspective])

  const _querySubscription = useRef<Subscription | undefined>()
  const _listenSubscription = useRef<Subscription | undefined>()

  const cancelQuery = useCallback(() => {
    if (!_querySubscription.current) {
      return
    }

    _querySubscription.current.unsubscribe()
    _querySubscription.current = undefined
  }, [])

  const cancelListener = useCallback(() => {
    if (!_listenSubscription.current) {
      return
    }

    _listenSubscription.current.unsubscribe()
    _listenSubscription.current = undefined
  }, [])

  const ensureSelectedApiVersion = useCallback(() => {
    const wantedApiVersion = customApiVersion || apiVersion
    if (_client.config().apiVersion !== wantedApiVersion) {
      _client.config({apiVersion: wantedApiVersion})
    }
  }, [_client, apiVersion, customApiVersion])

  const handleQueryExecution = useCallback(() => {
    if (queryInProgress) {
      cancelQuery()
      cancelListener()
      setQueryInProgress(false)
      return true
    }

    const _paramsError = params instanceof Error && params
    _localStorage.set('query', query)
    _localStorage.set('params', rawParams)

    cancelListener()

    setQueryInProgress(!_paramsError && Boolean(query))
    setListenInProgress(false)
    setListenMutations([])
    setError(_paramsError || undefined)
    setQueryResult(undefined)
    setQueryTime(undefined)
    setE2eTime(undefined)

    if (!query || _paramsError) {
      return true
    }

    ensureSelectedApiVersion()

    const urlQueryOpts: Record<string, string> = {}
    if (perspective !== 'raw') {
      urlQueryOpts.perspective = perspective
    }

    setUrl(
      _client.getUrl(_client.getDataUrl('query', encodeQueryString(query, params, urlQueryOpts))),
    )

    const queryStart = Date.now()

    _querySubscription.current = _client.observable
      .fetch(query, params, {filterResponse: false, tag: 'vision'})
      .subscribe({
        next: (res) => {
          setQueryTime(res.ms)
          setE2eTime(Date.now() - queryStart)
          setQueryResult(res.result)
          setQueryInProgress(false)
          setError(undefined)
        },
        error: (e) => {
          setError(e)
          setQuery(query)
          setQueryInProgress(false)
        },
      })

    return true
  }, [
    _client,
    _localStorage,
    cancelListener,
    cancelQuery,
    ensureSelectedApiVersion,
    params,
    perspective,
    query,
    queryInProgress,
    rawParams,
  ])

  const handleChangeDataset = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      _localStorage.set('dataset', dataset)
      setDataset(evt.target.value)
      _client.config({dataset})
      handleQueryExecution()
    },
    [_client, _localStorage, dataset, handleQueryExecution],
  )

  const handleChangeApiVersion = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const {value} = evt.target
      if (value === 'other') {
        setCustomApiVersion('v')
        _customApiVersionElement.current?.focus()
        return
      }

      setApiVersion(value)
      setCustomApiVersion(false)
      _localStorage.set('apiVersion', value)
      _client.config({apiVersion: value})
      handleQueryExecution()
    },
    [_client, _localStorage, handleQueryExecution],
  )

  const handleChangePerspective = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const {value} = evt.target
      if (!isPerspective(value)) {
        return
      }

      setPerspective(value)
      _localStorage.set('perspective', value)
      _client.config({perspective: value})
      handleQueryExecution()
    },
    [_client, _localStorage, handleQueryExecution],
  )

  const handleCustomApiVersionChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const {value = ''} = evt.target

      if (validateApiVersion(value)) {
        setApiVersion(value)
        _localStorage.set('apiVersion', value)
        _client.config({apiVersion: value})
      }

      setCustomApiVersion(value || 'v')
      setIsValidApiVersion(validateApiVersion(value))
    },
    [_client, _localStorage],
  )

  const handleCopyUrl = useCallback(() => {
    const el = _operationUrlElement.current
    if (!el) {
      return
    }

    try {
      el.select()
      document.execCommand('copy')
      toast.push({
        closable: true,
        title: 'Copied to clipboard',
        status: 'info',
        id: 'vision-copy',
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unable to copy to clipboard :(')
    }
  }, [toast])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
  }, [])

  const handleListenerEvent = useCallback(
    (evt: ListenEvent<any>) => {
      if (evt.type !== 'mutation') {
        toast.push({
          closable: true,
          id: 'vision-listen',
          status: 'success',
          title: 'Listening for mutations…',
        })
        return
      }

      setListenMutations((prev) => {
        if (prev.length === 50) {
          return [evt, ...prev.slice(0, 49)]
        }

        return [evt, ...prev]
      })
    },
    [toast],
  )

  const handleParamsChange = useCallback(
    ({raw, parsed, valid, error: e}: ParamsEditorChangeEvent) => {
      setRawParams(raw)
      setParams(parsed)
      setHasValidParams(valid)
      setParamsError(e)

      _localStorage.set('params', raw)
    },
    [_localStorage],
  )

  const handleListenExecution = useCallback(() => {
    if (listenInProgress) {
      cancelListener()
      setListenInProgress(false)
      return
    }

    ensureSelectedApiVersion()

    const _paramsError = params instanceof Error ? params : undefined
    const encodeParams = params instanceof Error ? {} : params || {}

    const shouldExecute = !_paramsError && query.trim().length > 0

    _localStorage.set('query', query)
    _localStorage.set('params', rawParams)

    cancelQuery()

    setUrl(_client.getDataUrl('listen', encodeQueryString(query, encodeParams, {})))
    setListenMutations([])
    setQueryInProgress(false)
    setQueryResult(undefined)
    setListenInProgress(shouldExecute)
    setError(_paramsError)
    setQueryTime(undefined)
    setE2eTime(undefined)

    if (!shouldExecute) {
      return
    }

    _listenSubscription.current = _client
      .listen(query, params, {events: ['mutation', 'welcome']})
      .subscribe({
        next: handleListenerEvent,
        error: (e) => {
          setError(e)
          setQuery(query)
          setListenInProgress(false)
        },
      })
  }, [
    _client,
    _localStorage,
    cancelListener,
    cancelQuery,
    ensureSelectedApiVersion,
    handleListenerEvent,
    listenInProgress,
    params,
    query,
    rawParams,
  ])

  const handlePaste = useCallback(
    (evt: ClipboardEvent) => {
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

      let _apiVersion: string | undefined
      let _customApiVersion: string | false | undefined

      if (validateApiVersion(usedApiVersion)) {
        if (API_VERSIONS.includes(usedApiVersion)) {
          _apiVersion = usedApiVersion
          _customApiVersion = false
        } else {
          _customApiVersion = usedApiVersion
        }
      }

      const _perspective = PERSPECTIVES.includes(parts.options.perspective as ClientPerspective)
        ? (parts.options.perspective as ClientPerspective)
        : undefined

      evt.preventDefault()

      setQuery(parts.query)
      setParams(parts.params)
      setRawParams(JSON.stringify(parts.params, null, 2))

      if (datasets.includes(usedDataset)) {
        setDataset(usedDataset)
      }

      if (_apiVersion) {
        setApiVersion(_apiVersion)
      }

      if (_customApiVersion) {
        setCustomApiVersion(_customApiVersion)
      }

      if (_perspective) {
        setPerspective(_perspective)
      }

      const newDataset = datasets.includes(usedDataset) ? usedDataset : dataset

      // FIX: Review this logic again
      _localStorage.merge({
        query: parts.query,
        params: parts.params,
        dataset: newDataset,
        apiVersion: _customApiVersion || _apiVersion,
        perspective: _perspective || perspective,
      })

      _client.config({
        dataset: newDataset,
        apiVersion: _customApiVersion || _apiVersion,
        perspective: _perspective || perspective,
      })

      handleQueryExecution()
      toast.push({
        closable: true,
        id: 'vision-paste',
        status: 'info',
        title: 'Parsed URL to query',
      })
    },
    [_client, _localStorage, dataset, datasets, handleQueryExecution, perspective, toast],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isWithinRoot = _visionRoot.current && nodeContains(_visionRoot.current, event.target)
      const isWithinParamsEditor =
        _paramsEditorContainer.current && nodeContains(_paramsEditorContainer.current, event.target)

      if (isRunHotkey(event) && (isWithinRoot || isWithinParamsEditor) && hasValidParams) {
        handleQueryExecution()
        event.preventDefault()
        event.stopPropagation()
      }
    },
    [handleQueryExecution, hasValidParams],
  )

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('keydown', handleKeyDown)

      cancelQuery()
      cancelListener()
    }
    // only want it to run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries?.[0]

    setPaneSizeOptions(calculatePaneSizeOptions(entry.contentRect.height))
  }, [])

  useEffect(() => {
    let resizeListener: ResizeObserver | undefined

    if (_visionRoot.current) {
      resizeListener = new ResizeObserver(handleResize)
      resizeListener.observe(_visionRoot.current)
    }

    return () => {
      resizeListener?.disconnect()
    }
  }, [handleResize])

  return (
    <Root direction="column" height="fill" ref={_visionRoot} sizing="border" overflow="hidden">
      <Header paddingX={3} paddingY={2}>
        <Grid columns={[1, 4, 8, 12]}>
          {/* Dataset selector */}
          <Box padding={1} column={2}>
            <Stack>
              <Card paddingTop={2} paddingBottom={3}>
                <StyledLabel>{t('settings.dataset-label')}</StyledLabel>
              </Card>
              <Select value={dataset} onChange={handleChangeDataset}>
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
                onChange={handleChangeApiVersion}
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
                  ref={_customApiVersionElement}
                  value={customApiVersion}
                  onChange={handleCustomApiVersionChange}
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

              <Select value={perspective} onChange={handleChangePerspective}>
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
                    <QueryCopyLink onClick={handleCopyUrl}>
                      [{t('action.copy-url-to-clipboard')}]
                    </QueryCopyLink>
                  </StyledLabel>
                </Card>
                <Flex flex={1} gap={1}>
                  <Box flex={1}>
                    <TextInput readOnly type="url" ref={_operationUrlElement} value={url} />
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
                      onClick={handleCopyUrl}
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
              <InputContainer display="flex" ref={_queryEditorContainer}>
                <Box flex={1}>
                  <InputBackgroundContainerLeft>
                    <Flex>
                      <StyledLabel muted>{t('query.label')}</StyledLabel>
                    </Flex>
                  </InputBackgroundContainerLeft>
                  <VisionCodeMirror value={query} onChange={handleQueryChange} />
                </Box>
              </InputContainer>
              <InputContainer display="flex" ref={_paramsEditorContainer}>
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
                  <ParamsEditor value={rawParams} onChange={handleParamsChange} />
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
                              onClick={handleQueryExecution}
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
                            onClick={handleListenExecution}
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
